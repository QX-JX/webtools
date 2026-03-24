import {
  Shield, Globe, Server, Activity, FileCode, Lock,
  Monitor, UserCircle, Wifi, BookOpen, Code, Award,
  Layout, Terminal, Image, Square, Type,
  Box, Link2, RefreshCw, FileText, Search, Mail,
  Hash, Binary, FileJson, Minimize2, Maximize2,
  LucideIcon
} from 'lucide-react'

export interface Tool {
  id: string
  title: string
  description: string
  icon: LucideIcon
  path: string
  color: string
  category: string
}

export const tools: Tool[] = [
  // 网站检测类
  {
    id: 'csr',
    title: 'tools.csr.title',
    description: 'tools.csr.description',
    icon: Shield,
    path: '/tools/csr',
    color: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
    category: 'detection'
  },
  {
    id: 'whois',
    title: 'tools.whois.title',
    description: 'tools.whois.description',
    icon: Globe,
    path: '/tools/whois',
    color: 'bg-gradient-to-br from-purple-400 to-purple-600',
    category: 'detection'
  },
  {
    id: 'dns',
    title: 'tools.dns.title',
    description: 'tools.dns.description',
    icon: Server,
    path: '/tools/dns',
    color: 'bg-gradient-to-br from-blue-400 to-blue-600',
    category: 'detection'
  },
  {
    id: 'dns-enhanced',
    title: 'tools.dnsEnhanced.title',
    description: 'tools.dnsEnhanced.description',
    icon: Server,
    path: '/tools/dns-enhanced',
    color: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
    category: 'detection'
  },
  {
    id: 'http-status',
    title: 'tools.httpStatus.title',
    description: 'tools.httpStatus.description',
    icon: Activity,
    path: '/tools/http-status',
    color: 'bg-gradient-to-br from-slate-500 to-slate-700',
    category: 'detection'
  },
  {
    id: 'gzip',
    title: 'tools.gzip.title',
    description: 'tools.gzip.description',
    icon: FileCode,
    path: '/tools/gzip',
    color: 'bg-gradient-to-br from-pink-400 to-pink-600',
    category: 'detection'
  },
  {
    id: 'ssl',
    title: 'tools.ssl.title',
    description: 'tools.ssl.description',
    icon: Lock,
    path: '/tools/ssl',
    color: 'bg-gradient-to-br from-green-400 to-green-600',
    category: 'detection'
  },
  {
    id: 'browser-info',
    title: 'tools.browserInfo.title',
    description: 'tools.browserInfo.description',
    icon: Monitor,
    path: '/tools/browser-info',
    color: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
    category: 'detection'
  },
  {
    id: 'useragent',
    title: 'tools.useragent.title',
    description: 'tools.useragent.description',
    icon: UserCircle,
    path: '/tools/useragent',
    color: 'bg-gradient-to-br from-teal-400 to-teal-600',
    category: 'detection'
  },
  {
    id: 'websocket',
    title: 'tools.websocket.title',
    description: 'tools.websocket.description',
    icon: Wifi,
    path: '/tools/websocket',
    color: 'bg-gradient-to-br from-violet-400 to-violet-600',
    category: 'detection'
  },
  {
    id: 'view-source',
    title: 'tools.viewSource.title',
    description: 'tools.viewSource.description',
    icon: Code,
    path: '/tools/view-source',
    color: 'bg-gradient-to-br from-gray-500 to-gray-700',
    category: 'detection'
  },

  // SEO工具类
  {
    id: 'meta-generator',
    title: 'tools.metaGenerator.title',
    description: 'tools.metaGenerator.description',
    icon: FileText,
    path: '/tools/meta-generator',
    color: 'bg-gradient-to-br from-orange-400 to-orange-600',
    category: 'seo'
  },
  {
    id: 'meta-check',
    title: 'tools.metaCheck.title',
    description: 'tools.metaCheck.description',
    icon: Search,
    path: '/tools/meta-check',
    color: 'bg-gradient-to-br from-amber-400 to-amber-600',
    category: 'seo'
  },
  {
    id: 'robots',
    title: 'tools.robots.title',
    description: 'tools.robots.description',
    icon: FileJson,
    path: '/tools/robots',
    color: 'bg-gradient-to-br from-lime-400 to-lime-600',
    category: 'seo'
  },
  {
    id: 'email-encrypt',
    title: 'tools.emailEncrypt.title',
    description: 'tools.emailEncrypt.description',
    icon: Mail,
    path: '/tools/email-encrypt',
    color: 'bg-gradient-to-br from-rose-400 to-rose-600',
    category: 'seo'
  },

  // 开发工具类
  {
    id: 'php-reference',
    title: 'tools.phpReference.title',
    description: 'tools.phpReference.description',
    icon: BookOpen,
    path: '/tools/php-reference',
    color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    category: 'dev'
  },
  {
    id: 'html-preview',
    title: 'tools.htmlPreview.title',
    description: 'tools.htmlPreview.description',
    icon: Layout,
    path: '/tools/html-preview',
    color: 'bg-gradient-to-br from-orange-500 to-red-500',
    category: 'dev'
  },
  {
    id: 'js-debug',
    title: 'tools.jsDebug.title',
    description: 'tools.jsDebug.description',
    icon: Terminal,
    path: '/tools/js-debug',
    color: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    category: 'dev'
  },
  {
    id: 'shield-badge',
    title: 'tools.shieldBadge.title',
    description: 'tools.shieldBadge.description',
    icon: Award,
    path: '/tools/shield-badge',
    color: 'bg-gradient-to-br from-slate-600 to-slate-800',
    category: 'dev'
  },
  {
    id: 'favicon',
    title: 'tools.favicon.title',
    description: 'tools.favicon.description',
    icon: Image,
    path: '/tools/favicon',
    color: 'bg-gradient-to-br from-fuchsia-400 to-fuchsia-600',
    category: 'dev'
  },

  // CSS工具类
  {
    id: 'css-glassmorphism',
    title: 'tools.cssGlassmorphism.title',
    description: 'tools.cssGlassmorphism.description',
    icon: Square,
    path: '/tools/css-glassmorphism',
    color: 'bg-gradient-to-br from-sky-400 to-sky-600',
    category: 'dev'
  },
  {
    id: 'css-neumorphism',
    title: 'tools.cssNeumorphism.title',
    description: 'tools.cssNeumorphism.description',
    icon: Box,
    path: '/tools/css-neumorphism',
    color: 'bg-gradient-to-br from-gray-400 to-gray-600',
    category: 'dev'
  },
  {
    id: 'px-to-rem',
    title: 'tools.pxToRem.title',
    description: 'tools.pxToRem.description',
    icon: Hash,
    path: '/tools/px-to-rem',
    color: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    category: 'dev'
  },
  {
    id: 'css-border-radius',
    title: 'tools.cssBorderRadius.title',
    description: 'tools.cssBorderRadius.description',
    icon: Square,
    path: '/tools/css-border-radius',
    color: 'bg-gradient-to-br from-red-400 to-red-600',
    category: 'dev'
  },
  {
    id: 'css-text-shadow',
    title: 'tools.cssTextShadow.title',
    description: 'tools.cssTextShadow.description',
    icon: Type,
    path: '/tools/css-text-shadow',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    category: 'dev'
  },
  {
    id: 'css-box-shadow',
    title: 'tools.cssBoxShadow.title',
    description: 'tools.cssBoxShadow.description',
    icon: Box,
    path: '/tools/css-box-shadow',
    color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    category: 'dev'
  },

  // 编码转换类
  {
    id: 'base64',
    title: 'tools.base64.title',
    description: 'tools.base64.description',
    icon: Binary,
    path: '/tools/base64',
    color: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
    category: 'encode'
  },
  {
    id: 'url-encode',
    title: 'tools.urlEncode.title',
    description: 'tools.urlEncode.description',
    icon: Link2,
    path: '/tools/url-encode',
    color: 'bg-gradient-to-br from-green-400 to-green-600',
    category: 'encode'
  },
  {
    id: 'html-entity',
    title: 'tools.htmlEntity.title',
    description: 'tools.htmlEntity.description',
    icon: Code,
    path: '/tools/html-entity',
    color: 'bg-gradient-to-br from-orange-400 to-orange-600',
    category: 'encode'
  },
  {
    id: 'js-minify',
    title: 'tools.jsMinify.title',
    description: 'tools.jsMinify.description',
    icon: Minimize2,
    path: '/tools/js-minify',
    color: 'bg-gradient-to-br from-yellow-500 to-amber-600',
    category: 'encode'
  },
  {
    id: 'css-minify',
    title: 'tools.cssMinify.title',
    description: 'tools.cssMinify.description',
    icon: Maximize2,
    path: '/tools/css-minify',
    color: 'bg-gradient-to-br from-blue-400 to-blue-600',
    category: 'encode'
  },

  // 其他工具
  {
    id: 'desktop-shortcut',
    title: 'tools.desktopShortcut.title',
    description: 'tools.desktopShortcut.description',
    icon: Link2,
    path: '/tools/desktop-shortcut',
    color: 'bg-gradient-to-br from-pink-500 to-rose-500',
    category: 'other'
  },
  {
    id: 'page-refresh',
    title: 'tools.pageRefresh.title',
    description: 'tools.pageRefresh.description',
    icon: RefreshCw,
    path: '/tools/page-refresh',
    color: 'bg-gradient-to-br from-cyan-500 to-teal-500',
    category: 'other'
  },
  {
    id: 'http-codes',
    title: 'tools.httpCodes.title',
    description: 'tools.httpCodes.description',
    icon: Activity,
    path: '/tools/http-codes',
    color: 'bg-gradient-to-br from-slate-500 to-slate-700',
    category: 'other'
  },
  {
    id: 'worker-demo',
    title: 'tools.workerDemo.title',
    description: 'tools.workerDemo.description',
    icon: Activity,
    path: '/tools/worker-demo',
    color: 'bg-gradient-to-br from-purple-500 to-indigo-500',
    category: 'other'
  },
  {
    id: 'form-validation',
    title: 'tools.formValidation.title',
    description: 'tools.formValidation.description',
    icon: Shield,
    path: '/tools/form-validation',
    color: 'bg-gradient-to-br from-green-500 to-emerald-500',
    category: 'other'
  },
]

export const categories = [
  { id: 'detection', name: 'categories.detection', icon: Monitor },
  { id: 'seo', name: 'categories.seo', icon: Search },
  { id: 'dev', name: 'categories.dev', icon: Code },
  { id: 'encode', name: 'categories.encode', icon: Binary },
  { id: 'other', name: 'categories.other', icon: Box },
]
