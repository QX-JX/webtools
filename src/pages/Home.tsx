import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { categories, tools } from '../data/tools'
import { ResponsiveToolList } from '../components/ResponsiveToolCard'
import ResponsiveContainer, { ResponsiveButton } from '../components/ResponsiveLayout'
import { MobileFloatingButton } from '../components/MobileNavigation'
import { useResponsive } from '../hooks/useResponsive'
import { AnalyticsManager } from '../utils/analytics'

const getToolPath = (toolId: string): string => {
  let toolData = tools.find((tool) => tool.id === toolId)
  if (toolData) return toolData.path

  const simplifiedId = toolId.replace(/-generator|-lookup|-tool|-check|-encode|-minify|-preview|-debug|-parser|-test|-info$/g, '')
  toolData = tools.find((tool) => tool.id === simplifiedId || tool.id.includes(simplifiedId))
  if (toolData) return toolData.path

  toolData = tools.find((tool) => tool.path.includes(toolId.split('-')[0]))
  if (toolData) return toolData.path

  return `/tools/${toolId}`
}

export default function Home() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const { isMobile } = useResponsive()
  const navigate = useNavigate()

  useEffect(() => {
    const analytics = AnalyticsManager.getInstance()
    analytics.trackPageView('home', t('common.home'))
  }, [t])

  useEffect(() => {
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    if (category) {
      setActiveCategory(category)
    }

    if (search) {
      setSearchTerm(search)
    }
  }, [searchParams])

  useEffect(() => {
    const handleCategoryChange = (event: CustomEvent) => {
      setActiveCategory(event.detail)
    }

    window.addEventListener('categoryChange', handleCategoryChange as EventListener)
    return () => {
      window.removeEventListener('categoryChange', handleCategoryChange as EventListener)
    }
  }, [])

  const handleToolClick = (toolId: string) => {
    navigate(getToolPath(toolId))
  }

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const translatedTitle = t(tool.title)
      const translatedDescription = t(tool.description)
      const matchesSearch =
        translatedTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        translatedDescription.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory

      return matchesSearch && matchesCategory
    })
  }, [activeCategory, searchTerm, t])

  return (
    <ResponsiveContainer className="py-2">
      <div className="mx-auto mb-3 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className={`w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isMobile ? 'text-sm' : 'text-sm'
            }`}
          />
        </div>
      </div>

      <div className={`mb-4 flex flex-wrap justify-center gap-1.5 ${isMobile ? 'mobile-gap-2' : 'gap-1.5'}`}>
        <ResponsiveButton
          onClick={() => setActiveCategory('all')}
          variant={activeCategory === 'all' ? 'primary' : 'outline'}
          size={{ mobile: 'sm', tablet: 'sm', desktop: 'sm', large: 'sm' }}
        >
          {t('common.all')}
        </ResponsiveButton>

        {categories.map((category) => {
          const Icon = category.icon
          return (
            <ResponsiveButton
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              variant={activeCategory === category.id ? 'primary' : 'outline'}
              size={{ mobile: 'sm', tablet: 'sm', desktop: 'sm', large: 'sm' }}
              className="flex items-center gap-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              {t(category.name)}
            </ResponsiveButton>
          )
        })}
      </div>

      <div className="mb-8">
        <ResponsiveToolList
          tools={filteredTools}
          showUsage={false}
          onToolClick={handleToolClick}
          columns={{ mobile: 1, tablet: 2, desktop: 3, large: 4 }}
        />
      </div>

      {filteredTools.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">{t('common.noToolsFound')}</p>
        </div>
      )}

      <MobileFloatingButton
        onClick={() => {
          const searchInput = document.querySelector(`input[placeholder="${t('common.search')}"]`) as HTMLInputElement | null
          if (searchInput) {
            searchInput.focus()
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }}
        icon={Search}
        position="bottom-right"
        color="indigo"
      />
    </ResponsiveContainer>
  )
}
