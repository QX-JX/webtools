import { Loader, AlertCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface LoginDialogProps {
  isOpen: boolean
  isLoading: boolean
  error: string | null
  onLogin: () => void
  onCancel: () => void
  onClose: () => void
}

export default function LoginDialog({
  isOpen,
  isLoading,
  error,
  onLogin,
  onCancel,
  onClose
}: LoginDialogProps) {
  const { t } = useTranslation()
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* 关闭按钮 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{t('auth.login')}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {isLoading ? (
            // 登录中状态
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader className="w-12 h-12 text-blue-500 animate-spin" />
              </div>
              <p className="text-gray-600">{t('auth.loggingIn')}</p>
              <p className="text-sm text-gray-500">{t('auth.loginInstructions')}</p>
              <button
                onClick={() => {
                  onCancel()
                  onClose()
                }}
                className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('auth.cancelLogin')}
              </button>
            </div>
          ) : error ? (
            // 错误状态
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-600">{t('auth.loginFailed')}</p>
                  <p className="text-sm text-gray-600 mt-1">{error}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onLogin}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {t('auth.retry')}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('auth.close')}
                </button>
              </div>
            </div>
          ) : (
            // 初始状态
            <div className="space-y-4">
              <p className="text-gray-600">
                {t('auth.loginDescription')}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  {t('auth.loginTip')}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onLogin}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  {t('auth.openBrowserLogin')}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  {t('auth.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
