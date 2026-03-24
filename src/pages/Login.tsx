import { useLayoutEffect, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Loader } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

function safeReturnPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  if (raw === '/login' || raw.startsWith('/login?')) return '/'
  return raw
}

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, register, cancelLogin, loading, error, isLoggingIn, isLoggedIn } = useAuth()
  const tab = searchParams.get('tab') === 'register' ? 'register' : 'login'
  const returnUrl = safeReturnPath(searchParams.get('return'))

  useLayoutEffect(() => {
    document.title = t('auth.loginPageSeoTitle')
  }, [t])

  useEffect(() => {
    if (isLoggedIn) {
      navigate(returnUrl, { replace: true })
    }
  }, [isLoggedIn, navigate, returnUrl])

  return (
    <div className="kq-login-page max-w-lg mx-auto px-4 py-10 md:py-16">
      <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-8 text-white text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{t('auth.loginPageHeading')}</h1>
          <p className="mt-2 text-sm text-white/90">{t('auth.loginPageSubSync')}</p>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex gap-2">
            <Link
              to={`/login?tab=login&return=${encodeURIComponent(returnUrl)}`}
              className={`flex-1 text-center px-4 py-2 rounded-lg text-sm font-medium ${
                tab === 'login' ? 'bg-white text-gray-900 shadow-sm border' : 'text-gray-600 hover:text-gray-900 border'
              }`}
            >
              {t('auth.loginTab')}
            </Link>
            <Link
              to={`/login?tab=register&return=${encodeURIComponent(returnUrl)}`}
              className={`flex-1 text-center px-4 py-2 rounded-lg text-sm font-medium ${
                tab === 'register' ? 'bg-white text-gray-900 shadow-sm border' : 'text-gray-600 hover:text-gray-900 border'
              }`}
            >
              {t('auth.registerTab')}
            </Link>
          </div>

          {isLoggingIn || loading ? (
            <div className="text-center space-y-4 py-6">
              <div className="flex justify-center">
                <Loader className="w-12 h-12 text-indigo-500 animate-spin" />
              </div>
              <p className="text-gray-700">{t('auth.loggingIn')}</p>
              <p className="text-sm text-gray-500">{t('auth.loginInstructions')}</p>
              <button
                type="button"
                onClick={cancelLogin}
                className="w-full mt-2 px-4 py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                {t('auth.cancelLogin')}
              </button>
            </div>
          ) : error ? (
            <div className="space-y-4 mt-6">
              <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700">{t('auth.loginFailed')}</p>
                  <p className="text-sm text-red-600/90 mt-1">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void (tab === 'register' ? register() : login())}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                {t('auth.retry')}
              </button>
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              <p className="text-gray-600 text-sm leading-relaxed">
                {tab === 'login' ? t('auth.loginDescriptionSync') : t('auth.registerDescriptionSync')}
              </p>
              <button
                type="button"
                onClick={() => void (tab === 'register' ? register() : login())}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                {tab === 'login' ? t('auth.openBrowserLogin') : t('auth.openBrowserRegister')}
              </button>
            </div>
          )}

          <div className="mt-6 text-xs text-center text-gray-500">
            <Link to="/" className="text-indigo-600 hover:underline">
              {t('common.back')}
            </Link>
            {' · '}
            <Link to={`/user-center?return=${encodeURIComponent(returnUrl)}`} className="text-indigo-600 hover:underline">
              {t('auth.userCenter')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
