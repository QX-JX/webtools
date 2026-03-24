import { X, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface LoginRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: () => void
}

export default function LoginRequiredModal({ isOpen, onClose, onLogin }: LoginRequiredModalProps) {
  const { t } = useTranslation()
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* 头部 - 关闭按钮 */}
        <div className="flex justify-end p-6 pb-0">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 pb-6 space-y-6 text-center">
          {/* 标题 */}
          <div className="flex items-center justify-center gap-2">
            <LogIn className="w-6 h-6 text-gray-800" />
            <h2 className="text-2xl font-bold text-gray-900">{t('auth.loginReminder')}</h2>
          </div>

          {/* 主要提示文本 */}
          <p className="text-gray-700 text-base leading-relaxed">
            {t('auth.loginRequiredDescription')}
          </p>
          
          {/* 说明文本 - 灰色背景 */}
          <div className="bg-gray-100 rounded-2xl p-5 text-sm text-gray-600 leading-relaxed">
            {t('auth.loginActionDescription')}
          </div>

          {/* 立即登录按钮 */}
          <button
            onClick={onLogin}
            className="w-full px-6 py-3.5 bg-black text-white rounded-full hover:bg-gray-900 transition-colors font-semibold text-base flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            {t('auth.loginNow')}
          </button>

          {/* 底部提示 */}
          <p className="text-gray-500 text-sm">
            {t('auth.loginBenefit')}
          </p>
        </div>
      </div>
    </div>
  )
}
