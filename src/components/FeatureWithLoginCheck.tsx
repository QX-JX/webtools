import { ReactNode } from 'react'
import { useLoginRequired } from '../hooks/useLoginRequired'
import LoginRequiredModal from './LoginRequiredModal'

interface FeatureWithLoginCheckProps {
  children: ReactNode
  requireLogin?: boolean
}

/**
 * 包装组件：用于需要登录才能使用的功能
 * 
 * 使用示例：
 * <FeatureWithLoginCheck requireLogin>
 *   <YourFeatureComponent />
 * </FeatureWithLoginCheck>
 */
export default function FeatureWithLoginCheck({ 
  children, 
  requireLogin = true 
}: FeatureWithLoginCheckProps) {
  const { isLoggedIn, showLoginModal, setShowLoginModal, handleLogin } = useLoginRequired()

  if (requireLogin && !isLoggedIn) {
    return (
      <>
        {/* 显示禁用状态 */}
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        
        {/* 登录提醒弹窗 */}
        <LoginRequiredModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
        />
      </>
    )
  }

  return <>{children}</>
}
