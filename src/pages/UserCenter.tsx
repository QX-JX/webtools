import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, LogOut, ExternalLink, Loader } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { KUNQIONG_AITOOLS_USER_CENTER } from '../config/kunqiongLinks'

function safeReturnPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

export default function UserCenter() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const returnUrl = safeReturnPath(searchParams.get('return'))
  const { isLoggedIn, userInfo, login, register, logout, loading } = useAuth()

  useEffect(() => {
    document.title = t('auth.userCenterSeoTitle')
  }, [t])

  return (
    <div className="max-w-lg mx-auto px-4 py-10 md:py-16">
      <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-8 text-white text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{t('auth.userCenter')}</h1>
          <p className="mt-2 text-sm text-white/90">{t('auth.userCenterWelcome')}</p>
        </div>

        <div className="p-6 md:p-8">
          {!isLoggedIn ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{t('auth.loginRequiredDescription')}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => void login()}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  {t('auth.loginTab')}
                </button>
                <button
                  type="button"
                  onClick={() => void register()}
                  className="flex-1 py-3 rounded-xl border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-50 transition-colors"
                >
                  {t('auth.registerTab')}
                </button>
              </div>
              <Link
                to={`/login?return=${encodeURIComponent(returnUrl)}`}
                className="text-sm text-indigo-600 hover:underline"
              >
                {t('auth.loginPageHeading')}
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {userInfo?.avatar ? (
                  <img
                    src={userInfo.avatar}
                    alt={userInfo.nickname || ''}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-100 bg-gray-100"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-gray-900 truncate">
                    {userInfo?.nickname?.trim() || t('auth.user')}
                  </p>
                  <p className="text-sm text-gray-500">{t('auth.loggedIn')}</p>
                </div>
              </div>

              <a
                href={KUNQIONG_AITOOLS_USER_CENTER}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-gray-800 hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-indigo-600" />
                {t('auth.userCenterOpenFull')}
              </a>

              <button
                type="button"
                onClick={() => void logout()}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                {loading ? t('auth.loggingOut') : t('auth.logout')}
              </button>
            </div>
          )}

          <div className="mt-8 text-xs text-center text-gray-500">
            <Link to={returnUrl} className="text-indigo-600 hover:underline">
              {t('common.back')}
            </Link>
            {' · '}
            <Link to="/" className="text-indigo-600 hover:underline">
              {t('kunqiongNav.home')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
