import { useState } from 'react'
import { Activity, Search } from 'lucide-react'
import { useI18nSection } from '../../i18n/helpers'

export default function HttpCodes() {
  const text = useI18nSection<any>('pages.httpCodes')
  const httpCodes = text.codes
  const categories = text.categories
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const filteredCodes = httpCodes.filter((code: any) => {
    const matchesSearch = search === '' || 
      code.code.toString().includes(search) ||
      code.name.toLowerCase().includes(search.toLowerCase()) ||
      code.desc.includes(search)
    const matchesCategory = category === 'all' || code.category === category
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (cat: string) => {
    return categories.find((item: any) => item.id === cat)?.color || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-slate-500 to-slate-700 rounded-2xl flex items-center justify-center">
          <Activity className="w-8 h-8 text-white" />
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
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                category === cat.id ? cat.color : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Codes List */}
      <div className="space-y-3">
        {filteredCodes.map((code) => (
          <div key={code.code} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <span className={`px-3 py-1.5 rounded-lg font-bold text-lg ${getCategoryColor(code.category)}`}>
                {code.code}
              </span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{code.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{code.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCodes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {text.noMatch}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-2">{text.infoTitle}</h3>
        <ul className="text-slate-600 text-sm leading-relaxed space-y-1">
          {text.infoItems.map((item: string) => {
            const [prefix, desc] = item.split(' - ')
            const colorMap: Record<string, string> = {
              '1xx': 'text-blue-600',
              '2xx': 'text-green-600',
              '3xx': 'text-yellow-600',
              '4xx': 'text-orange-600',
              '5xx': 'text-red-600',
            }
            return (
              <li key={item}>
                <span className={`${colorMap[prefix] || 'text-slate-600'} font-medium`}>{prefix}</span> - {desc}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
