import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export function useLoginRequired() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)

  const checkLogin = useCallback(() => {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return false
    }
    return true
  }, [isLoggedIn])

  const handleLogin = useCallback(() => {
    setShowLoginModal(false)
    navigate('/login')
  }, [navigate])

  return {
    isLoggedIn,
    showLoginModal,
    setShowLoginModal,
    checkLogin,
    handleLogin
  }
}
