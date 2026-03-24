import { useTranslation } from 'react-i18next'
import {
  kunqiongFooterCategories,
  kunqiongFooterLegal,
  kunqiongFooterLogoUrl,
  kunqiongFooterQuick,
} from '../config/kunqiongLinks'
import { onKunqiongLinkClick } from '../utils/kunqiongExternal'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="footer safe-area-bottom">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section footer-brand-section">
            <img src={kunqiongFooterLogoUrl} alt={t('kunqiongNav.footerLogoAlt')} className="footer-logo" />
            <p className="footer-desc">{t('footer.kunqiongBrandDesc')}</p>
          </div>

          <div className="footer-section">
            <h4>{t('footer.quickLinks')}</h4>
            <ul>
              {kunqiongFooterQuick.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => onKunqiongLinkClick(item.href, e)}
                  >
                    {t(item.i18nKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-section">
            <h4>{t('footer.toolCategories')}</h4>
            <ul>
              {kunqiongFooterCategories.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => onKunqiongLinkClick(item.href, e)}
                  >
                    {t(item.i18nKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-section">
            <h4>{t('footer.contactTitle')}</h4>
            <ul className="contact-list">
              <li>
                <svg
                  className="contact-icon-img"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>{t('footer.contactCompany')}</span>
              </li>
              <li>
                <svg
                  className="contact-icon-img"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {t('footer.contactPhone')}
              </li>
              <li>
                <svg
                  className="contact-icon-img"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{t('footer.contactRegion')}</span>
              </li>
              <li>
                <svg
                  className="contact-icon-img"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {t('footer.contactEmail')}
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright-links">
            <span>{t('footer.copyrightLine')}</span>
            <span className="separator">|</span>
            <a
              href={kunqiongFooterLegal.agreement}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => onKunqiongLinkClick(kunqiongFooterLegal.agreement, e)}
            >
              {t('footer.userAgreement')}
            </a>
            <span className="separator">|</span>
            <a
              href={kunqiongFooterLegal.privacy}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => onKunqiongLinkClick(kunqiongFooterLegal.privacy, e)}
            >
              {t('footer.privacyPolicy')}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
