import { useState, useRef } from 'react'
import { Layout, Play, Trash2, Maximize2, Minimize2 } from 'lucide-react'
import { useI18nSection } from '../../i18n/helpers'

function createDefaultHtml(message: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: white;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
    }
    h1 { color: #333; margin: 0 0 10px; }
    p { color: #666; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello World!</h1>
    <p>${message}</p>
  </div>
</body>
</html>`
}

export default function HtmlPreview() {
  const text = useI18nSection<any>('pages.htmlPreview')
  const [html, setHtml] = useState(() => createDefaultHtml(text.defaultMessage))
  const [isFullscreen, setIsFullscreen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const runCode = () => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()
      }
    }
  }

  const clearCode = () => {
    setHtml('')
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write('')
        doc.close()
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
          <Layout className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      <div className={`grid gap-4 ${isFullscreen ? '' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Editor */}
        {!isFullscreen && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
              <span className="font-medium text-gray-700">{text.editorTitle}</span>
              <div className="flex gap-2">
                <button
                  onClick={clearCode}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  title={text.clear}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="w-full h-[500px] p-4 font-mono text-sm resize-none focus:outline-none"
              placeholder={text.editorPlaceholder}
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview */}
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <span className="font-medium text-gray-700">{text.previewTitle}</span>
            <div className="flex gap-2">
              <button
                onClick={runCode}
                className="px-4 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm"
              >
                <Play className="w-4 h-4" />
                {text.run}
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                title={isFullscreen ? text.exitFullscreen : text.fullscreen}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <iframe
            ref={iframeRef}
            className={`w-full bg-white ${isFullscreen ? 'h-[calc(100%-52px)]' : 'h-[500px]'}`}
            sandbox="allow-scripts allow-same-origin"
            title="preview"
          />
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 bg-orange-50 rounded-xl p-6 border border-orange-100">
        <h3 className="font-semibold text-orange-800 mb-2">{text.usageTitle}</h3>
        <ul className="text-orange-700 text-sm leading-relaxed space-y-1">
          {text.usageItems.map((item: string) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
