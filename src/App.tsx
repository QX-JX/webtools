import { Routes, Route, useLocation, useSearchParams } from 'react-router-dom'
import { lazy, Suspense, useLayoutEffect, useEffect } from 'react'
import Layout from './components/Layout'
import Home from './pages/Home'
import LoadingSpinner from './components/LoadingSpinner'
import { saveToken, saveStoredUserInfo, normalizeKunqiongUserInfo } from './utils/auth'
import { stripAuthParamsFromCurrentLocation } from './config/kunqiongLinks'
import i18n from './i18n/config'
import { applyDocumentSeo } from './i18n/seo'

// Lazy load tool components
const CsrGenerator = lazy(() => import('./pages/tools/CsrGenerator'))
const WhoisLookup = lazy(() => import('./pages/tools/WhoisLookup'))
const DnsLookup = lazy(() => import('./pages/tools/DnsLookup'))
const HttpStatus = lazy(() => import('./pages/tools/HttpStatus'))
const GzipCheck = lazy(() => import('./pages/tools/GzipCheck'))
const SslCheck = lazy(() => import('./pages/tools/SslCheck'))
const BrowserInfo = lazy(() => import('./pages/tools/BrowserInfo'))
const UserAgentParser = lazy(() => import('./pages/tools/UserAgentParser'))
const WebSocketTest = lazy(() => import('./pages/tools/WebSocketTest'))
const ViewSource = lazy(() => import('./pages/tools/ViewSource'))
const Base64Tool = lazy(() => import('./pages/tools/Base64Tool'))
const UrlEncode = lazy(() => import('./pages/tools/UrlEncode'))
const HtmlEntity = lazy(() => import('./pages/tools/HtmlEntity'))
const MetaGenerator = lazy(() => import('./pages/tools/MetaGenerator'))
const RobotsGenerator = lazy(() => import('./pages/tools/RobotsGenerator'))
const EmailEncrypt = lazy(() => import('./pages/tools/EmailEncrypt'))
const CssGlassmorphism = lazy(() => import('./pages/tools/CssGlassmorphism'))
const CssBoxShadow = lazy(() => import('./pages/tools/CssBoxShadow'))
const CssBorderRadius = lazy(() => import('./pages/tools/CssBorderRadius'))
const PxToRem = lazy(() => import('./pages/tools/PxToRem'))
const HtmlPreview = lazy(() => import('./pages/tools/HtmlPreview'))
const JsDebug = lazy(() => import('./pages/tools/JsDebug'))
const CssTextShadow = lazy(() => import('./pages/tools/CssTextShadow'))
const CssNeumorphism = lazy(() => import('./pages/tools/CssNeumorphism'))
const HttpCodes = lazy(() => import('./pages/tools/HttpCodes'))
const ShieldBadge = lazy(() => import('./pages/tools/ShieldBadge'))
const FaviconGenerator = lazy(() => import('./pages/tools/FaviconGenerator'))
const JsMinify = lazy(() => import('./pages/tools/JsMinify'))
const CssMinify = lazy(() => import('./pages/tools/CssMinify'))
const PageRefresh = lazy(() => import('./pages/tools/PageRefresh'))
const PhpReference = lazy(() => import('./pages/tools/PhpReference'))
const MetaCheck = lazy(() => import('./pages/tools/MetaCheck'))
const DesktopShortcut = lazy(() => import('./pages/tools/DesktopShortcut'))
const DnsLookupEnhanced = lazy(() => import('./pages/tools/DnsLookupEnhanced'))
const WorkerDemo = lazy(() => import('./pages/tools/WorkerDemo'))
const FormValidationDemo = lazy(() => import('./pages/tools/FormValidationDemo'))
const Login = lazy(() => import('./pages/Login'))
const UserCenter = lazy(() => import('./pages/UserCenter'))

// 页面切换时滚动到顶部，并同步 canonical / og:url 等与当前地址相关的 SEO
function ScrollToTop() {
  const { pathname } = useLocation()

  // 使用 useLayoutEffect 在绘制前同步执行，避免闪烁
  useLayoutEffect(() => {
    // 禁用浏览器的滚动恢复功能
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)
    applyDocumentSeo(i18n)
  }, [pathname])

  return null
}

function App() {
  const [searchParams] = useSearchParams()

  // 处理登录回调（官网回跳可能使用不同参数名；仅同域或带 token 的 URL 才能写入本地）
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
    const hashParams = new URLSearchParams(hash)
    const pick =
      query.get('token') ||
      query.get('login_token') ||
      query.get('auth_token') ||
      query.get('access_token') ||
      query.get('kq_token') ||
      query.get('ticket') ||
      hashParams.get('token') ||
      hashParams.get('login_token') ||
      hashParams.get('auth_token') ||
      hashParams.get('access_token') ||
      searchParams.get('token')
    let token = pick
    if (!token) {
      const dataParam = query.get('data')
      if (dataParam) {
        try {
          const parsed = JSON.parse(decodeURIComponent(dataParam)) as { token?: string }
          if (parsed?.token) token = parsed.token
        } catch {
          /* ignore */
        }
      }
    }
    if (token) {
      const userInfoRaw = query.get('user_info') || query.get('userInfo')
      if (userInfoRaw) {
        try {
          const parsed = JSON.parse(decodeURIComponent(userInfoRaw)) as unknown
          saveStoredUserInfo(normalizeKunqiongUserInfo(parsed))
        } catch {
          try {
            saveStoredUserInfo(normalizeKunqiongUserInfo(JSON.parse(userInfoRaw) as unknown))
          } catch {
            /* ignore */
          }
        }
      }
      saveToken(token)
      stripAuthParamsFromCurrentLocation()
      window.location.reload()
    }
  }, [searchParams])

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="user-center" element={<UserCenter />} />
          <Route path="/tools/csr" element={<CsrGenerator />} />
          <Route path="/tools/whois" element={<WhoisLookup />} />
          <Route path="/tools/dns" element={<DnsLookup />} />
          <Route path="/tools/http-status" element={<HttpStatus />} />
          <Route path="/tools/gzip" element={<GzipCheck />} />
          <Route path="/tools/ssl" element={<SslCheck />} />
          <Route path="/tools/browser-info" element={<BrowserInfo />} />
          <Route path="/tools/useragent" element={<UserAgentParser />} />
          <Route path="/tools/websocket" element={<WebSocketTest />} />
          <Route path="/tools/view-source" element={<ViewSource />} />
          <Route path="/tools/base64" element={<Base64Tool />} />
          <Route path="/tools/url-encode" element={<UrlEncode />} />
          <Route path="/tools/html-entity" element={<HtmlEntity />} />
          <Route path="/tools/meta-generator" element={<MetaGenerator />} />
          <Route path="/tools/robots" element={<RobotsGenerator />} />
          <Route path="/tools/email-encrypt" element={<EmailEncrypt />} />
          <Route path="/tools/css-glassmorphism" element={<CssGlassmorphism />} />
          <Route path="/tools/css-box-shadow" element={<CssBoxShadow />} />
          <Route path="/tools/css-border-radius" element={<CssBorderRadius />} />
          <Route path="/tools/px-to-rem" element={<PxToRem />} />
          <Route path="/tools/html-preview" element={<HtmlPreview />} />
          <Route path="/tools/js-debug" element={<JsDebug />} />
          <Route path="/tools/css-text-shadow" element={<CssTextShadow />} />
          <Route path="/tools/css-neumorphism" element={<CssNeumorphism />} />
          <Route path="/tools/http-codes" element={<HttpCodes />} />
          <Route path="/tools/shield-badge" element={<ShieldBadge />} />
          <Route path="/tools/favicon" element={<FaviconGenerator />} />
          <Route path="/tools/js-minify" element={<JsMinify />} />
          <Route path="/tools/css-minify" element={<CssMinify />} />
          <Route path="/tools/page-refresh" element={<PageRefresh />} />
          <Route path="/tools/php-reference" element={<PhpReference />} />
          <Route path="/tools/meta-check" element={<MetaCheck />} />
          <Route path="/tools/desktop-shortcut" element={<DesktopShortcut />} />
          <Route path="/tools/dns-enhanced" element={<DnsLookupEnhanced />} />
          <Route path="/tools/worker-demo" element={<WorkerDemo />} />
          <Route path="/tools/form-validation" element={<FormValidationDemo />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
