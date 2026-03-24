import { useState } from 'react'
import { Link2, Download, Globe, FileText } from 'lucide-react'
import { useI18nSection } from '../../i18n/helpers'

export default function DesktopShortcut() {
  const text = useI18nSection<any>('pages.desktopShortcut')
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleGenerate = () => {
    if (!url.trim()) {
      setError(text.enterUrl)
      return
    }
    if (!name.trim()) {
      setError(text.enterName)
      return
    }
    setError('')

    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }

    // 生成 .url 文件内容 (Windows Internet Shortcut)
    const urlFileContent = `[InternetShortcut]\r\nURL=${targetUrl}\r\n`
    
    // 创建 Blob 并下载
    const blob = new Blob([urlFileContent], { type: 'application/internet-shortcut' })
    const downloadUrl = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `${name.trim()}.url`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(downloadUrl)
  }

  const handleGenerateHtml = () => {
    if (!url.trim()) {
      setError(text.enterUrl)
      return
    }
    if (!name.trim()) {
      setError(text.enterName)
      return
    }
    setError('')

    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }

    // 生成 HTML 快捷方式（跨平台兼容）
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${targetUrl}">
  <title>${name.trim()}</title>
</head>
<body>
  <p>${text.redirectingTo} <a href="${targetUrl}">${targetUrl}</a></p>
</body>
</html>`
    
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const downloadUrl = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `${name.trim()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(downloadUrl)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center">
          <Link2 className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{text.urlLabel}</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={text.urlPlaceholder}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{text.nameLabel}</label>
          <div className="relative">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={text.namePlaceholder}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleGenerate}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            <Download className="w-5 h-5" />
            {text.downloadUrlFile}
          </button>
          <button
            onClick={handleGenerateHtml}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            <Download className="w-5 h-5" />
            {text.downloadHtmlFile}
          </button>
        </div>
      </div>

      <div className="mt-8 bg-pink-50 rounded-xl p-6 border border-pink-100">
        <h3 className="font-semibold text-pink-800 mb-3">{text.infoTitle}</h3>
        <div className="text-pink-700 text-sm space-y-2">
          <p>{text.urlFileDesc}</p>
          <p>{text.htmlFileDesc}</p>
          <p className="mt-3">{text.afterDownload}</p>
        </div>
      </div>
    </div>
  )
}
