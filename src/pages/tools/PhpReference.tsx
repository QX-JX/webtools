import { useState } from 'react'
import { BookOpen, Search, ExternalLink } from 'lucide-react'
import { useI18nSection } from '../../i18n/helpers'

export default function PhpReference() {
  const text = useI18nSection<any>('pages.phpReference')
  const phpFunctions = text.functions
  const categories = text.categories
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(categories[0])

  const filteredFunctions = phpFunctions.filter((fn: any) => {
    const matchesSearch = search === '' || 
      fn.name.toLowerCase().includes(search.toLowerCase()) ||
      fn.desc.includes(search)
    const matchesCategory = category === categories[0] || fn.category === category
    return matchesSearch && matchesCategory
  })

  const groupedFunctions = filteredFunctions.reduce((acc, fn) => {
    if (!acc[fn.category]) acc[fn.category] = []
    acc[fn.category].push(fn)
    return acc
  }, {} as Record<string, typeof phpFunctions>)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={text.searchPlaceholder}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                category === cat
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Functions List */}
      <div className="space-y-6">
        {Object.entries(groupedFunctions).map(([cat, functions]) => (
          <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">{cat}函数 ({functions.length})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {functions.map((fn: any) => (
                <div key={fn.name} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-indigo-600 font-semibold">{fn.name}()</code>
                        <a
                          href={`https://www.php.net/manual/zh/function.${fn.name.replace(/_/g, '-')}.php`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-indigo-500"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{fn.desc}</p>
                      <code className="text-xs text-gray-500 mt-2 block font-mono bg-gray-100 px-2 py-1 rounded">
                        {fn.syntax}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredFunctions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {text.noMatch}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-indigo-50 rounded-xl p-6 border border-indigo-100">
        <h3 className="font-semibold text-indigo-800 mb-2">{text.infoTitle}</h3>
        <p className="text-indigo-700 text-sm">
          {text.infoDescription}
        </p>
      </div>
    </div>
  )
}
