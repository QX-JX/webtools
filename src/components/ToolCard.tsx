import { Link } from 'react-router-dom'
import { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ToolCardProps {
  title: string
  description: string
  icon: LucideIcon
  path: string
  color: string
}

export default function ToolCard({ title, description, icon: Icon, path, color }: ToolCardProps) {
  const { t } = useTranslation()
  return (
    <Link to={path} className="tool-card group">
      <div className="flex items-start gap-4">
        <div className={`tool-icon ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
            {t(title)}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{t(description)}</p>
        </div>
      </div>
    </Link>
  )
}
