import { useEffect, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  kunqiongHeaderNavBlocks,
  KUNQIONG_ORIGIN,
  kunqiongLogoUrl,
  type KunqiongHeaderNavBlock,
} from '../config/kunqiongLinks'
import { useAuth } from '../hooks/useAuth'
import { onKunqiongLinkClick } from '../utils/kunqiongExternal'
import UserPanel from './UserPanel'
import LanguageSwitcher from './LanguageSwitcher'

function CategoryChevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M2 4L6 8L10 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="header-search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function renderNavBlock(
  block: KunqiongHeaderNavBlock,
  t: (k: string) => string,
  onNavigate: () => void,
) {
  const linkClass = (active?: boolean) => `nav-link${active ? ' active' : ''}`

  const linkProps = (href: string) => ({
    href,
    target: '_blank' as const,
    rel: 'noopener noreferrer' as const,
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      onKunqiongLinkClick(href, e)
      onNavigate()
    },
  })

  switch (block.variant) {
    case 'plain':
      return (
        <a key={block.href} {...linkProps(block.href)} className={linkClass(block.active)}>
          {t(block.i18nKey)}
        </a>
      )
    case 'aiDropdown':
      return (
        <div key={block.href} className="nav-item-wrapper">
          <a {...linkProps(block.href)} className={linkClass()}>
            {t(block.i18nKey)}
          </a>
          <button
            type="button"
            className="category-dropdown-toggle"
            aria-label={t('kunqiongNav.navExpandAria')}
            onClick={() => {
              const href = block.href
              if (window.electron?.openExternal) {
                void window.electron.openExternal(href)
              } else {
                window.open(href, '_blank', 'noopener,noreferrer')
              }
            }}
          >
            <CategoryChevron />
          </button>
        </div>
      )
    case 'wrapped':
      return (
        <div key={block.href} className="nav-item-wrapper">
          <a {...linkProps(block.href)} className={linkClass(block.active)}>
            {t(block.i18nKey)}
          </a>
        </div>
      )
  }
}

export default function Header() {
  const { t } = useTranslation()
  const { isLoggedIn, userInfo, logout, login, loading } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  const handleSearch = () => {
    const url = `${KUNQIONG_ORIGIN}/`
    if (window.electron?.openExternal) {
      void window.electron.openExternal(url)
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  /** Web / Electron：统一为后端 /api/auth/start + 新窗口鲲穹登录页 + 轮询 token（见集成说明）。 */
  const handleLoginRegister = () => {
    void login()
  }

  return (
    <>
      <header className="header header-solid safe-area-top">
        <div className="header-container">
          <div className="header-left">
            <div className="logo">
              <a
                href={KUNQIONG_ORIGIN}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => onKunqiongLinkClick(KUNQIONG_ORIGIN, e)}
              >
                <img src={kunqiongLogoUrl} alt={t('kunqiongNav.logoAlt')} className="logo-img" />
              </a>
            </div>
          </div>

          <nav className="nav" aria-label="Main">
            {kunqiongHeaderNavBlocks.map((block) => renderNavBlock(block, t, () => {}))}
          </nav>

          <div className="header-right">
            <div className="header-actions">
              <button
                type="button"
                className="header-search-btn text-gray-600"
                aria-label={t('kunqiongNav.navSearchAria')}
                onClick={handleSearch}
              >
                <SearchIcon />
              </button>

              <button
                type="button"
                className="mobile-menu-btn"
                aria-label={t('kunqiongNav.navMenuAria')}
                onClick={() => setMobileOpen((v) => !v)}
              >
                <span className="text-lg leading-none">☰</span>
              </button>

              <LanguageSwitcher variant="header" />

              {isLoggedIn ? (
                <UserPanel
                  avatar={userInfo?.avatar}
                  nickname={userInfo?.nickname}
                  onLogout={logout}
                  isLoading={loading}
                  variant="kunqiongHeader"
                />
              ) : (
                <button
                  type="button"
                  className="header-login-btn inline-flex items-center justify-center"
                  onClick={handleLoginRegister}
                  disabled={loading}
                >
                  {t('kunqiongNav.loginRegister')}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="kq-mobile-nav-overlay kq-open" onClick={closeMobile}>
          <div
            className="kq-mobile-nav-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t('kunqiongNav.navMenuAria')}
          >
            <nav className="flex flex-col">
              {kunqiongHeaderNavBlocks.map((block) => {
                const href = block.href
                const active =
                  block.variant === 'plain' || block.variant === 'wrapped' ? Boolean(block.active) : false
                return (
                  <a
                    key={`${block.variant}-${href}`}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`nav-link${active ? ' active' : ''}`}
                    onClick={(e) => {
                      onKunqiongLinkClick(href, e)
                      closeMobile()
                    }}
                  >
                    {t(block.i18nKey)}
                  </a>
                )
              })}
            </nav>
            <div className="mt-4 pt-4 border-t border-gray-100 px-2 flex flex-col gap-2">
              {isLoggedIn ? (
                <UserPanel
                  avatar={userInfo?.avatar}
                  nickname={userInfo?.nickname}
                  onLogout={() => {
                    void logout()
                    closeMobile()
                  }}
                  isLoading={loading}
                  variant="default"
                  triggerClassName="flex items-center gap-2 w-full justify-start px-3 py-2 rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-50"
                />
              ) : (
                <button
                  type="button"
                  className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium"
                  onClick={() => {
                    handleLoginRegister()
                    closeMobile()
                  }}
                  disabled={loading}
                >
                  {t('kunqiongNav.loginRegister')}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
