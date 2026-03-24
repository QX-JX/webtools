import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExportFormat, ExportOptions } from '../utils/export'

interface ExportFormatSelectorProps {
  onExport: (format: ExportFormat, options: ExportOptions) => void
  disabled?: boolean
  className?: string
  buttonText?: string
}

const ExportFormatSelector: React.FC<ExportFormatSelectorProps> = ({
  onExport,
  disabled = false,
  className = '',
  buttonText
}) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const resolvedButtonText = buttonText || t('components.exportFormatSelector.buttonText')

  const formats: { value: ExportFormat; label: string; icon: string }[] = [
    { value: 'json', label: 'JSON', icon: '📄' },
    { value: 'csv', label: 'CSV', icon: '📊' },
    { value: 'txt', label: 'TXT', icon: '📝' },
    { value: 'xml', label: 'XML', icon: '📋' },
    { value: 'pdf', label: 'PDF', icon: '📑' }
  ]

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true)
    setIsOpen(false)

    try {
      const options: ExportOptions = {
        format,
        includeMetadata: true,
        prettyPrint: true
      }

      await onExport(format, options)
    } catch (error) {
      console.error(t('components.exportFormatSelector.exportFailed'), error)
      alert(t('components.exportFormatSelector.exportFailed'))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
            {t('components.exportFormatSelector.exporting')}
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {resolvedButtonText}
          </>
        )}
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
            <div className="py-1">
              {formats.map((format) => (
                <button
                  key={format.value}
                  onClick={() => handleExport(format.value)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  <span className="mr-3">{format.icon}</span>
                  {format.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ExportFormatSelector
