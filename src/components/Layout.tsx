import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { useResponsive } from '../hooks/useResponsive'
import { useEffect } from 'react'

export default function Layout() {
  const { isMobile } = useResponsive()

  // 移动端优化：防止内容被底部导航栏遮挡
  useEffect(() => {
    if (isMobile) {
      document.body.style.paddingBottom = '80px' // 为底部导航留出空间
    } else {
      document.body.style.paddingBottom = '0'
    }

    return () => {
      document.body.style.paddingBottom = '0'
    }
  }, [isMobile])

  return (
    <div className="kq-app-shell min-h-screen flex flex-col relative">
      <Header />
      <main className={`main-content kq-main-with-fixed-header flex-1 ${isMobile ? 'pb-20' : ''}`}>
        <div className="content-wrapper flex gap-6 w-full">
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
