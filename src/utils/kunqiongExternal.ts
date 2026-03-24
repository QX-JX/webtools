import type { MouseEvent } from 'react'

/** 浏览器新标签打开；Electron 下用系统浏览器打开，与 Header 中反馈等外链行为一致 */
export function onKunqiongLinkClick(url: string, event: MouseEvent<HTMLAnchorElement>) {
  if (window.electron?.openExternal) {
    event.preventDefault()
    void window.electron.openExternal(url)
  }
}
