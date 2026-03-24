/**
 * 文本处理 Worker
 * 用于执行复杂的文本处理操作
 */

export interface TextWorkerData {
  operation: 'wordCount' | 'characterCount' | 'lineCount' | 'diff' | 'similarity' | 'compress' | 'hash'
  text: string
  compareText?: string
  algorithm?: 'levenshtein' | 'jaccard'
  hashType?: 'md5' | 'sha1' | 'sha256'
}

export interface TextWorkerResult {
  result: number | string | string[] | { [key: string]: number }
  time: number
}

export function textWorker(data: TextWorkerData): TextWorkerResult {
  const startTime = performance.now();
  
  switch (data.operation) {
    case 'wordCount':
      return {
        result: countWords(data.text),
        time: performance.now() - startTime
      };
    
    case 'characterCount':
      return {
        result: countCharacters(data.text),
        time: performance.now() - startTime
      };
    
    case 'lineCount':
      return {
        result: countLines(data.text),
        time: performance.now() - startTime
      };
    
    case 'diff':
      if (!data.compareText) throw new Error('compareText is required for diff operation');
      return {
        result: calculateDiff(data.text, data.compareText),
        time: performance.now() - startTime
      };
    
    case 'similarity':
      if (!data.compareText) throw new Error('compareText is required for similarity operation');
      return {
        result: calculateSimilarity(data.text, data.compareText, data.algorithm || 'levenshtein'),
        time: performance.now() - startTime
      };
    
    case 'compress':
      return {
        result: compressText(data.text),
        time: performance.now() - startTime
      };
    
    case 'hash':
      return {
        result: hashText(data.text, data.hashType || 'md5'),
        time: performance.now() - startTime
      };
    
    default:
      throw new Error(`Unknown operation: ${data.operation}`);
  }
}

function countWords(text: string): number {
  // 移除多余空白字符并按空白字符分割
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

function countCharacters(text: string): number {
  // 计算字符数（包括空格）
  return text.length;
}

function countLines(text: string): number {
  // 计算行数，处理不同换行符
  const lines = text.split(/\r?\n/).filter(line => line.length > 0);
  return lines.length;
}

function calculateDiff(text1: string, text2: string): string[] {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  const diff: string[] = [];
  
  const maxLength = Math.max(lines1.length, lines2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const line1 = lines1[i] || '';
    const line2 = lines2[i] || '';
    
    if (line1 !== line2) {
      diff.push(`Line ${i + 1}:`);
      diff.push(`- ${line1}`);
      diff.push(`+ ${line2}`);
      diff.push('');
    }
  }
  
  return diff;
}

function calculateSimilarity(text1: string, text2: string, algorithm: string): number {
  switch (algorithm) {
    case 'levenshtein':
      return levenshteinSimilarity(text1, text2);
    case 'jaccard':
      return jaccardSimilarity(text1, text2);
    default:
      throw new Error(`Unknown similarity algorithm: ${algorithm}`);
  }
}

function levenshteinSimilarity(text1: string, text2: string): number {
  const distance = levenshteinDistance(text1, text2);
  const maxLength = Math.max(text1.length, text2.length);
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}

function levenshteinDistance(text1: string, text2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= text2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= text1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= text2.length; i++) {
    for (let j = 1; j <= text1.length; j++) {
      if (text2.charAt(i - 1) === text1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[text2.length][text1.length];
}

function jaccardSimilarity(text1: string, text2: string): number {
  const set1 = new Set(text1.toLowerCase().split('').filter(char => char.trim()));
  const set2 = new Set(text2.toLowerCase().split('').filter(char => char.trim()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 1 : intersection.size / union.size;
}

function compressText(text: string): string {
  // 简单的文本压缩算法（RLE）
  if (!text) return '';
  
  let compressed = '';
  let count = 1;
  let currentChar = text[0];
  
  for (let i = 1; i < text.length; i++) {
    if (text[i] === currentChar) {
      count++;
    } else {
      compressed += currentChar + (count > 1 ? count : '');
      currentChar = text[i];
      count = 1;
    }
  }
  
  compressed += currentChar + (count > 1 ? count : '');
  return compressed;
}

function hashText(text: string, hashType: string): string {
  // 简单的哈希函数实现
  let hash = 0;
  
  if (text.length === 0) return hash.toString();
  
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  switch (hashType) {
    case 'md5':
      return Math.abs(hash).toString(16).padStart(8, '0');
    case 'sha1':
      return Math.abs(hash).toString(36).padStart(10, '0');
    case 'sha256':
      return Math.abs(hash).toString(32).padStart(12, '0');
    default:
      return Math.abs(hash).toString();
  }
}