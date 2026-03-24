import { useState, useRef, useEffect } from 'react'
import { Wifi, Send, Trash2, Link, Unlink, Clock } from 'lucide-react'
import { useI18nSection } from '../../i18n/helpers'

interface Message {
  id: number
  type: 'sent' | 'received' | 'system'
  content: string
  timestamp: Date
}

export default function WebSocketTest() {
  const text = useI18nSection<any>('pages.websocketTest')
  const [url, setUrl] = useState(text.defaultUrl)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const addMessage = (type: Message['type'], content: string) => {
    setMessages(prev => [...prev, {
      id: ++idRef.current,
      type,
      content,
      timestamp: new Date()
    }])
  }

  const connect = () => {
    if (!url.trim()) return

    setConnecting(true)
    addMessage('system', text.connectingTo.replace('{{url}}', url))

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        setConnecting(false)
        addMessage('system', text.connectSuccess)
      }

      ws.onmessage = (event) => {
        addMessage('received', event.data)
      }

      ws.onerror = () => {
        addMessage('system', text.connectError)
        setConnecting(false)
      }

      ws.onclose = (event) => {
        setConnected(false)
        setConnecting(false)
        addMessage('system', text.connectionClosed.replace('{{code}}', String(event.code)))
        wsRef.current = null
      }
    } catch (error) {
      addMessage('system', text.connectFailed.replace('{{message}}', (error as Error).message))
      setConnecting(false)
    }
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
      addMessage('system', text.disconnecting)
    }
  }

  const sendMessage = () => {
    if (!message.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(message)
    addMessage('sent', message)
    setMessage('')
  }

  const clearMessages = () => {
    setMessages([])
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-violet-600 rounded-2xl flex items-center justify-center">
          <Wifi className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">在线WebSocket接口测试</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      {/* Connection */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Wifi className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={text.urlPlaceholder}
              disabled={connected}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-100"
            />
          </div>
          {connected ? (
            <button
              onClick={disconnect}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              <Unlink className="w-5 h-5" />
              {text.disconnect}
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg font-medium hover:from-violet-600 hover:to-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Link className="w-5 h-5" />
              {connecting ? text.connecting : text.connect}
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-500">
            {connected ? text.connected : connecting ? text.connecting : text.notConnected}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">{text.messageLog}</h2>
          <button
            onClick={clearMessages}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            {text.clear}
          </button>
        </div>
        <div ref={messagesContainerRef} className="h-80 overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              {text.noMessages}
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${
                    msg.type === 'system' ? 'w-full text-center' : ''
                  }`}>
                    {msg.type === 'system' ? (
                      <div className="text-sm text-gray-500 py-2">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatTime(msg.timestamp)} - {msg.content}
                      </div>
                    ) : (
                      <div className={`rounded-lg px-4 py-2 ${
                        msg.type === 'sent' 
                          ? 'bg-violet-500 text-white' 
                          : 'bg-white border border-gray-200'
                      }`}>
                        <p className="text-sm break-all whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.type === 'sent' ? 'text-violet-200' : 'text-gray-400'
                        }`}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Send Message */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder={text.messagePlaceholder}
            disabled={!connected}
            className="flex-1 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-100"
            rows={3}
          />
          <button
            onClick={sendMessage}
            disabled={!connected || !message.trim()}
            className="px-6 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg font-medium hover:from-violet-600 hover:to-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 bg-violet-50 rounded-xl p-6 border border-violet-100">
        <h3 className="font-semibold text-violet-800 mb-2">{text.infoTitle}</h3>
        <ul className="text-violet-700 text-sm leading-relaxed space-y-1">
          {text.infoItems.map((item: string) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
        
        <h3 className="font-semibold text-violet-800 mt-4 mb-2">{text.examplesTitle}</h3>
        <div className="text-violet-700 text-sm space-y-2">
          <div>
            <p className="font-medium">{text.publicEcho}</p>
            <ul className="ml-4 space-y-1 mt-1">
              <li>• wss://echo.websocket.org {text.defaultTag}</li>
              <li>• wss://ws.postman-echo.com/raw</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
