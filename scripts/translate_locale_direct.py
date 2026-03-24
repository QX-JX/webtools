#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import time
from pathlib import Path
from typing import Any
from urllib import request


LANGUAGE_NAMES = {
    "ar": "Arabic",
    "bn": "Bengali",
    "de": "German",
    "en": "English",
    "es": "Spanish",
    "fa": "Farsi (Persian)",
    "fr": "French",
    "he": "Hebrew",
    "hi": "Hindi",
    "id": "Indonesian",
    "it": "Italian",
    "ja": "Japanese",
    "ko": "Korean",
    "ms": "Malay",
    "nl": "Dutch",
    "pl": "Polish",
    "pt": "Portuguese",
    "pt_BR": "Brazilian Portuguese",
    "ru": "Russian",
    "sw": "Swahili",
    "ta": "Tamil",
    "th": "Thai",
    "tl": "Tagalog",
    "tr": "Turkish",
    "uk": "Ukrainian",
    "ur": "Urdu",
    "vi": "Vietnamese",
    "zh_CN": "Simplified Chinese",
    "zh_TW": "Traditional Chinese",
}

PLACEHOLDER_RE = re.compile(r"\{\{\s*[^{}]+\s*\}\}|\{[A-Za-z0-9_.-]+\}")
PATH_TOKEN_RE = re.compile(r"([^\.\[\]]+)|\[(\d+)\]")
CJK_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff]")
CJK_SAFE_LANGS = {"zh_CN", "zh_TW", "ja"}
ASCII_WORD_RE = re.compile(r"[A-Za-z]{3,}")
ASCII_LETTER_RE = re.compile(r"[A-Za-z]")
BROKEN_TEXT_RE = re.compile(r"\?{2,}|^\?$|^\?\s|\s\?$|\s\?\s")


def sorted_placeholders(text: str) -> list[str]:
    return sorted(PLACEHOLDER_RE.findall(text))


def same_placeholders(source: str, translated: str) -> bool:
    return sorted_placeholders(source) == sorted_placeholders(translated)


def is_probably_natural_english(text: str) -> bool:
    stripped = text.strip()
    if not stripped:
        return False
    if "://" in stripped:
        return False
    if any(token in stripped for token in ("console.log", "function ", "const ", "=>", "</", "/>", "{", "};")):
        return False
    if re.fullmatch(r"[A-Z0-9_./:#()[\]\-+*=,;<>|\\\s]+", stripped):
        return False
    if re.fullmatch(r"[a-z0-9_-]+", stripped, re.IGNORECASE) and len(stripped) <= 24:
        return False
    if re.fullmatch(r"[\d\s.,:%+-]+", stripped):
        return False
    letters = len(ASCII_LETTER_RE.findall(stripped))
    words = ASCII_WORD_RE.findall(stripped)
    return letters >= 8 and len(words) >= 2


def is_suspicious_translation(*, lang: str, candidate_value: str) -> bool:
    stripped = candidate_value.strip()
    if not stripped:
        return True
    if "\ufffd" in candidate_value:
        return True
    if BROKEN_TEXT_RE.search(candidate_value):
        return True
    if lang != "en" and is_probably_natural_english(candidate_value):
        return True
    return False


def collect_string_leaves(value: Any, prefix: str = "", acc: dict[str, str] | None = None) -> dict[str, str]:
    if acc is None:
        acc = {}

    if isinstance(value, dict):
        for key, child in value.items():
            if not isinstance(key, str):
                continue
            path_key = f"{prefix}.{key}" if prefix else key
            collect_string_leaves(child, path_key, acc)
        return acc

    if isinstance(value, list):
        for index, child in enumerate(value):
            path_key = f"{prefix}[{index}]"
            collect_string_leaves(child, path_key, acc)
        return acc

    if isinstance(value, str):
        acc[prefix] = value

    return acc


def parse_path_tokens(path_key: str) -> list[str | int]:
    tokens: list[str | int] = []
    for match in PATH_TOKEN_RE.finditer(path_key):
        name, index = match.groups()
        if name is not None:
            tokens.append(name)
        elif index is not None:
            tokens.append(int(index))
    if not tokens:
        raise ValueError(f"Invalid flattened path: {path_key}")
    return tokens


def set_path_value(root: Any, path_key: str, value: str) -> None:
    tokens = parse_path_tokens(path_key)
    cursor = root
    for token in tokens[:-1]:
        cursor = cursor[token]
    cursor[tokens[-1]] = value


def build_object(template: dict[str, Any], translated_flat: dict[str, str]) -> dict[str, Any]:
    result = json.loads(json.dumps(template, ensure_ascii=False))
    for path_key, value in translated_flat.items():
        set_path_value(result, path_key, value)
    return result


def sanitize_json_text(raw: str) -> str:
    trimmed = raw.strip()
    fenced = re.match(r"^```(?:json)?\s*([\s\S]*?)\s*```$", trimmed, re.IGNORECASE)
    content = fenced.group(1) if fenced else trimmed
    first_brace = content.find("{")
    last_brace = content.rfind("}")
    if first_brace < 0 or last_brace < 0 or last_brace <= first_brace:
        raise ValueError("Model response does not contain a valid JSON object.")
    return content[first_brace : last_brace + 1]


def request_chat_completion(*, base_url: str, api_key: str, model: str, messages: list[dict[str, str]], timeout_sec: int) -> str:
    payload = json.dumps({"model": model, "temperature": 0.2, "messages": messages}, ensure_ascii=False).encode("utf-8")
    req = request.Request(
        f"{base_url.rstrip('/')}/chat/completions",
        data=payload,
        method="POST",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
    )
    with request.urlopen(req, timeout=timeout_sec) as resp:
        body = resp.read().decode("utf-8")
    data = json.loads(body)
    content = data.get("choices", [{}])[0].get("message", {}).get("content")
    if not isinstance(content, str) or not content.strip():
        raise ValueError("Translation API response is missing message content.")
    return content


def is_valid_existing_value(*, lang: str, source_value: str, candidate_value: Any) -> bool:
    if not isinstance(candidate_value, str) or not candidate_value.strip():
        return False
    if not same_placeholders(source_value, candidate_value):
        return False
    if is_suspicious_translation(lang=lang, candidate_value=candidate_value):
        return False
    if lang != "zh_CN" and candidate_value == source_value and CJK_RE.search(source_value):
        return False
    if lang not in CJK_SAFE_LANGS and CJK_RE.search(candidate_value):
        return False
    return True


def chunk_entries(entries: list[tuple[str, str]], chunk_size: int) -> list[list[tuple[str, str]]]:
    return [entries[idx : idx + chunk_size] for idx in range(0, len(entries), chunk_size)]


def save_snapshot(*, output_path: Path, source_data: dict[str, Any], source_strings: dict[str, str], translated_flat: dict[str, str]) -> None:
    final_strings = {key: translated_flat.get(key, source_value) for key, source_value in source_strings.items()}
    final_obj = build_object(source_data, final_strings)
    temp_path = output_path.with_suffix(f"{output_path.suffix}.tmp")
    temp_path.write_text(json.dumps(final_obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp_path.replace(output_path)


def load_existing_strings(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        return {}
    return collect_string_leaves(data)


def translate_chunk(*, lang: str, entries: list[tuple[str, str]], base_url: str, model: str, api_key: str, timeout_sec: int, retries: int, retry_backoff_sec: float) -> dict[str, str]:
    source_keys = [key for key, _ in entries]
    source_values = [value for _, value in entries]
    language_name = LANGUAGE_NAMES.get(lang, lang)

    system_prompt = " ".join(
        [
            "You are a professional software localization translator.",
            f"Translate UI strings into {language_name}.",
            'Return ONLY valid JSON in the exact format {"values":[...]} with the same item count and order as the input.',
            "Preserve placeholders exactly, including forms like {{count}} and {{ value }}.",
            r"Preserve escaped newline markers (\n), URLs, code syntax, and markdown.",
            "Do not add explanations or code fences.",
        ]
    )
    user_prompt = "\n".join(
        [
            f"Target language code: {lang}",
            "Translate each input item into the target language.",
            json.dumps(source_values, ensure_ascii=False, indent=2),
        ]
    )

    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            content = request_chat_completion(
                base_url=base_url,
                api_key=api_key,
                model=model,
                messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                timeout_sec=timeout_sec,
            )
            parsed = json.loads(sanitize_json_text(content))
            values = parsed.get("values")
            if not isinstance(values, list) or len(values) != len(source_values):
                raise ValueError(f"Translated array mismatch for {lang}.")

            result: dict[str, str] = {}
            for idx, key in enumerate(source_keys):
                translated = values[idx]
                if not isinstance(translated, str):
                    raise ValueError(f"Translated value is not string at key: {key}")
                if not same_placeholders(source_values[idx], translated):
                    raise ValueError(f"Placeholder mismatch at key: {key}")
                result[key] = translated
            return result
        except Exception as err:
            last_error = err
            if attempt >= retries:
                break
            time.sleep((attempt + 1) * retry_backoff_sec)

    assert last_error is not None
    raise last_error


def translate_single_entry(*, lang: str, entry: tuple[str, str], base_url: str, model: str, api_key: str, timeout_sec: int, retries: int, retry_backoff_sec: float) -> dict[str, str]:
    key, source_value = entry
    language_name = LANGUAGE_NAMES.get(lang, lang)
    system_prompt = " ".join(
        [
            "You are a professional software localization translator.",
            f"Translate the UI string into {language_name}.",
            'Return ONLY valid JSON in the exact format {"value":"..."}',
            "Preserve placeholders exactly, including forms like {{count}} and {{ value }}.",
            r"Preserve escaped newline markers (\n), URLs, code syntax, and markdown.",
            "Do not add explanations or code fences.",
        ]
    )
    user_prompt = "\n".join(
        [
            f"Target language code: {lang}",
            f"Key: {key}",
            json.dumps(source_value, ensure_ascii=False),
        ]
    )

    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            content = request_chat_completion(
                base_url=base_url,
                api_key=api_key,
                model=model,
                messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                timeout_sec=timeout_sec,
            )
            parsed = json.loads(sanitize_json_text(content))
            value = parsed.get("value")
            if not isinstance(value, str):
                raise ValueError(f"Translated value is not string at key: {key}")
            if not same_placeholders(source_value, value):
                raise ValueError(f"Placeholder mismatch at key: {key}")
            return {key: value}
        except Exception as err:
            last_error = err
            if attempt >= retries:
                break
            time.sleep((attempt + 1) * retry_backoff_sec)

    assert last_error is not None
    raise last_error


def translate_entries(
    *,
    lang: str,
    entries: list[tuple[str, str]],
    base_url: str,
    model: str,
    api_key: str,
    timeout_sec: int,
    retries: int,
    retry_backoff_sec: float,
) -> dict[str, str]:
    try:
        return translate_chunk(
            lang=lang,
            entries=entries,
            base_url=base_url,
            model=model,
            api_key=api_key,
            timeout_sec=timeout_sec,
            retries=retries,
            retry_backoff_sec=retry_backoff_sec,
        )
    except Exception:
        if len(entries) <= 1:
            return translate_single_entry(
                lang=lang,
                entry=entries[0],
                base_url=base_url,
                model=model,
                api_key=api_key,
                timeout_sec=timeout_sec,
                retries=retries,
                retry_backoff_sec=retry_backoff_sec,
            )

        midpoint = len(entries) // 2
        left = translate_entries(
            lang=lang,
            entries=entries[:midpoint],
            base_url=base_url,
            model=model,
            api_key=api_key,
            timeout_sec=timeout_sec,
            retries=retries,
            retry_backoff_sec=retry_backoff_sec,
        )
        right = translate_entries(
            lang=lang,
            entries=entries[midpoint:],
            base_url=base_url,
            model=model,
            api_key=api_key,
            timeout_sec=timeout_sec,
            retries=retries,
            retry_backoff_sec=retry_backoff_sec,
        )
        merged = dict(left)
        merged.update(right)
        return merged


def main() -> int:
    parser = argparse.ArgumentParser(description="Translate one locale file with chunked checkpointing.")
    parser.add_argument("--source", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--lang", required=True)
    parser.add_argument("--base-url", default=os.getenv("LLM_BASE_URL", ""))
    parser.add_argument("--model", default=os.getenv("LLM_MODEL", ""))
    parser.add_argument("--api-key", default=os.getenv("LLM_API_KEY", ""))
    parser.add_argument("--chunk-size", type=int, default=5)
    parser.add_argument("--timeout-sec", type=int, default=180)
    parser.add_argument("--retries", type=int, default=4)
    parser.add_argument("--retry-backoff-sec", type=float, default=3.0)
    args = parser.parse_args()

    if not args.api_key:
        raise ValueError("Missing API key")

    source_path = Path(args.source).resolve()
    output_path = Path(args.output).resolve()
    source_data = json.loads(source_path.read_text(encoding="utf-8"))
    if not isinstance(source_data, dict):
        raise ValueError("Source JSON must be a top-level object.")

    source_strings = collect_string_leaves(source_data)
    translated_flat: dict[str, str] = {}
    existing_strings = load_existing_strings(output_path)
    for key, source_value in source_strings.items():
        existing_value = existing_strings.get(key)
        if is_valid_existing_value(lang=args.lang, source_value=source_value, candidate_value=existing_value):
            translated_flat[key] = existing_value

    pending_entries = [(key, value) for key, value in source_strings.items() if key not in translated_flat]
    if not pending_entries:
        print(f"[skip] {args.lang} no pending keys ({output_path})", flush=True)
        return 0

    print(f"[{args.lang}] incremental mode: reuse={len(translated_flat)} pending={len(pending_entries)}", flush=True)
    chunks = chunk_entries(pending_entries, args.chunk_size)
    for idx, chunk in enumerate(chunks, start=1):
        print(f"[{args.lang}] chunk {idx}/{len(chunks)} request ({len(chunk)} keys)", flush=True)
        translated_chunk = translate_entries(
            lang=args.lang,
            entries=chunk,
            base_url=args.base_url,
            model=args.model,
            api_key=args.api_key,
            timeout_sec=args.timeout_sec,
            retries=args.retries,
            retry_backoff_sec=args.retry_backoff_sec,
        )
        translated_flat.update(translated_chunk)
        save_snapshot(output_path=output_path, source_data=source_data, source_strings=source_strings, translated_flat=translated_flat)
        print(f"[{args.lang}] chunk {idx}/{len(chunks)} completed", flush=True)

    print(f"[done] {args.lang} -> {output_path}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
