const { contextBridge, ipcRenderer } = require('electron')

// Preload script for secure context isolation
window.addEventListener('DOMContentLoaded', () => {
  console.log('Kunqiong WebTools preload loaded')
})

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electron', {
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
})
