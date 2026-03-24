const { contextBridge, ipcRenderer } = require('electron')

// Preload script for secure context isolation
window.addEventListener('DOMContentLoaded', () => {
  console.log('全能站长工具已加载')
})

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electron', {
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
})
