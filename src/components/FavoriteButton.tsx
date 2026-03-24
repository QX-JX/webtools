import React from 'react'
import { useTranslation } from 'react-i18next'
import { useToolFavorite } from '../hooks/useToolHistory'

interface FavoriteButtonProps {
  toolId: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'outline' | 'solid' | 'ghost'
  showLabel?: boolean
  className?: string
  onToggle?: (isFavorite: boolean) => void
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  toolId,
  size = 'md',
  variant = 'outline',
  showLabel = false,
  className = '',
  onToggle
}) => {
  const { t } = useTranslation()
  const { isFavorite, toggleFavorite } = useToolFavorite(toolId)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const newStatus = await toggleFavorite()
      onToggle?.(newStatus)
    } catch (error) {
      console.error(t('favorite.failed'), error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-1.5 text-sm'
      case 'lg':
        return 'p-3 text-lg'
      default:
        return 'p-2 text-base'
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'solid':
        return isFavorite
          ? 'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600 hover:border-yellow-600'
          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
      case 'ghost':
        return isFavorite
          ? 'text-yellow-500 hover:bg-yellow-50'
          : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-50'
      default: // outline
        return isFavorite
          ? 'text-yellow-600 border-yellow-300 hover:bg-yellow-50 hover:border-yellow-400'
          : 'text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4'
      case 'lg':
        return 'w-6 h-6'
      default:
        return 'w-5 h-5'
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`inline-flex items-center justify-center border rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
        getSizeClasses()
      } ${getVariantClasses()} ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      aria-label={isFavorite ? t('favorite.remove') : t('favorite.add')}
      title={isFavorite ? t('favorite.remove') : t('favorite.add')}
    >
      <svg
        className={getIconSize()}
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
      
      {showLabel && (
        <span className={`ml-2 font-medium ${isFavorite ? 'text-yellow-700' : 'text-gray-600'}`}>
          {t('favorite.label')}
        </span>
      )}
      
      {isLoading && (
        <svg
          className="animate-spin ml-2 -mr-1 w-4 h-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
    </button>
  )
}

export default FavoriteButton