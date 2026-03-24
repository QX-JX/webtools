import { useState } from 'react'
import { FileJson, Copy, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { copyToClipboard } from '../../utils/clipboard'

interface Rule {
  id: number
  userAgent: string
  allow: string[]
  disallow: string[]
}

export default function RobotsGenerator() {
  const { t } = useTranslation()
  const [rules, setRules] = useState<Rule[]>([
    { id: 1, userAgent: '*', allow: ['/'], disallow: ['/admin/', '/private/'] }
  ])
  const [sitemap, setSitemap] = useState('')
  const [crawlDelay, setCrawlDelay] = useState('')
  const [copied, setCopied] = useState(false)

  const addRule = () => {
    setRules([...rules, { id: Date.now(), userAgent: '*', allow: [], disallow: [] }])
  }

  const removeRule = (id: number) => {
    if (rules.length > 1) {
      setRules(rules.filter(r => r.id !== id))
    }
  }

  const updateRule = (id: number, field: keyof Rule, value: string | string[]) => {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const addPath = (ruleId: number, type: 'allow' | 'disallow') => {
    setRules(rules.map(r => {
      if (r.id === ruleId) {
        return { ...r, [type]: [...r[type], ''] }
      }
      return r
    }))
  }

  const updatePath = (ruleId: number, type: 'allow' | 'disallow', index: number, value: string) => {
    setRules(rules.map(r => {
      if (r.id === ruleId) {
        const paths = [...r[type]]
        paths[index] = value
        return { ...r, [type]: paths }
      }
      return r
    }))
  }

  const removePath = (ruleId: number, type: 'allow' | 'disallow', index: number) => {
    setRules(rules.map(r => {
      if (r.id === ruleId) {
        return { ...r, [type]: r[type].filter((_, i) => i !== index) }
      }
      return r
    }))
  }

  const generateRobots = () => {
    const lines: string[] = []
    
    rules.forEach((rule, index) => {
      if (index > 0) lines.push('')
      lines.push(`User-agent: ${rule.userAgent}`)
      
      rule.disallow.filter(p => p).forEach(path => {
        lines.push(`Disallow: ${path}`)
      })
      
      rule.allow.filter(p => p).forEach(path => {
        lines.push(`Allow: ${path}`)
      })
      
      if (crawlDelay && rule.userAgent === '*') {
        lines.push(`Crawl-delay: ${crawlDelay}`)
      }
    })
    
    if (sitemap) {
      lines.push('')
      lines.push(`Sitemap: ${sitemap}`)
    }
    
    return lines.join('\n')
  }

  const copyCode = async () => {
    const success = await copyToClipboard(generateRobots())
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const useTemplate = (template: 'allow-all' | 'block-all' | 'standard') => {
    switch (template) {
      case 'allow-all':
        setRules([{ id: 1, userAgent: '*', allow: ['/'], disallow: [] }])
        break
      case 'block-all':
        setRules([{ id: 1, userAgent: '*', allow: [], disallow: ['/'] }])
        break
      case 'standard':
        setRules([{ id: 1, userAgent: '*', allow: ['/'], disallow: ['/admin/', '/api/', '/private/', '/*.json$'] }])
        break
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-lime-400 to-lime-600 rounded-2xl flex items-center justify-center">
          <FileJson className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.robotsGenerator.title')}</h1>
          <p className="text-gray-500">{t('pages.robotsGenerator.description')}</p>
        </div>
      </div>

      {/* Templates */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 py-2">{t('pages.robotsGenerator.templatesLabel')}</span>
          <button onClick={() => useTemplate('allow-all')} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm">{t('pages.robotsGenerator.templates.allowAll')}</button>
          <button onClick={() => useTemplate('block-all')} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm">{t('pages.robotsGenerator.templates.blockAll')}</button>
          <button onClick={() => useTemplate('standard')} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm">{t('pages.robotsGenerator.templates.standard')}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          {rules.map((rule, ruleIndex) => (
            <div key={rule.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">{t('pages.robotsGenerator.ruleTitle', { index: ruleIndex + 1 })}</h2>
                {rules.length > 1 && (
                  <button onClick={() => removeRule(rule.id)} className="text-red-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User-agent</label>
                  <select
                  value={rule.userAgent}
                  onChange={(e) => updateRule(rule.id, 'userAgent', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                >
                    <option value="*">{t('pages.robotsGenerator.userAgents.all')}</option>
                    <option value="Googlebot">Googlebot</option>
                    <option value="Bingbot">Bingbot</option>
                    <option value="Baiduspider">{t('pages.robotsGenerator.userAgents.baidu')}</option>
                    <option value="Sogou">{t('pages.robotsGenerator.userAgents.sogou')}</option>
                    <option value="360Spider">360Spider</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">{t('pages.robotsGenerator.disallow')}</label>
                    <button onClick={() => addPath(rule.id, 'disallow')} className="text-lime-600 hover:text-lime-700 text-sm flex items-center gap-1">
                      <Plus className="w-4 h-4" /> {t('pages.robotsGenerator.add')}
                    </button>
                  </div>
                  {rule.disallow.map((path, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={path}
                        onChange={(e) => updatePath(rule.id, 'disallow', index, e.target.value)}
                        placeholder="/path/"
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                      />
                      <button onClick={() => removePath(rule.id, 'disallow', index)} className="text-red-500 hover:text-red-600 px-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">{t('pages.robotsGenerator.allow')}</label>
                    <button onClick={() => addPath(rule.id, 'allow')} className="text-lime-600 hover:text-lime-700 text-sm flex items-center gap-1">
                      <Plus className="w-4 h-4" /> {t('pages.robotsGenerator.add')}
                    </button>
                  </div>
                  {rule.allow.map((path, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={path}
                        onChange={(e) => updatePath(rule.id, 'allow', index, e.target.value)}
                        placeholder="/path/"
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                      />
                      <button onClick={() => removePath(rule.id, 'allow', index)} className="text-red-500 hover:text-red-600 px-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addRule}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-lime-500 hover:text-lime-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> {t('pages.robotsGenerator.addRule')}
          </button>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{t('pages.robotsGenerator.otherSettings')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.robotsGenerator.sitemapUrl')}</label>
                <input
                  type="text"
                  value={sitemap}
                  onChange={(e) => setSitemap(e.target.value)}
                  placeholder="https://example.com/sitemap.xml"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.robotsGenerator.crawlDelay')}</label>
                <input
                  type="number"
                  value={crawlDelay}
                  onChange={(e) => setCrawlDelay(e.target.value)}
                  placeholder="10"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
              </div>
            </div>
          </div>
        </div>

      {/* Preview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit sticky top-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">{t('pages.robotsGenerator.preview')}</h2>
          <button
            onClick={copyCode}
            className="px-4 py-2 bg-lime-100 text-lime-700 rounded-lg hover:bg-lime-200 transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            {copied ? t('pages.robotsGenerator.copied') : t('pages.robotsGenerator.copy')}
          </button>
        </div>
          <pre className="p-4 bg-gray-800 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap min-h-[200px]">
            {generateRobots()}
          </pre>
          <p className="text-sm text-gray-500 mt-4">
            {t('pages.robotsGenerator.saveTip')}
          </p>
        </div>
      </div>
    </div>
  )
}
