'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import AnimatedButton from '@/components/AnimatedButton'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 데모 모드 체크
    if (!isSupabaseConfigured()) {
      // 데모 모드에서는 로컬스토리지 확인
      const demoUser = localStorage.getItem('demoUser')
      
      if (demoUser) {
        const user = JSON.parse(demoUser)
        if (user.email === formData.email) {
          // 데모 로그인 성공
          localStorage.setItem('isLoggedIn', 'true')
          router.push('/')
          router.refresh()
          return
        }
      }
      
      // 데모 모드에서 등록된 이메일이 없는 경우
      setError('데모 모드: 먼저 회원가입을 해주세요')
      setLoading(false)
      return
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (authError) {
        throw new Error(authError.message || '로그인에 실패했습니다')
      }

      if (data.user) {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      console.error('로그인 오류:', err)
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다')
        } else if (err.message.includes('Email not confirmed')) {
          setError('이메일 인증이 필요합니다. 메일함을 확인해주세요')
        } else {
          setError(err.message)
        }
      } else {
        setError('로그인에 실패했습니다')
      }
    } finally {
      setLoading(false)
    }
  }

  // 데모 모드 빠른 로그인
  const handleDemoLogin = () => {
    localStorage.setItem('demoUser', JSON.stringify({
      email: 'demo@hankkihanni.com',
      nickname: '데모 사용자',
      guardianPhone: '010-1234-5678',
      streak: 7,
      createdAt: new Date().toISOString()
    }))
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('currentStreak', '7')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 max-w-md w-full"
      >
        {/* 데모 모드 알림 */}
        {!isSupabaseConfigured() && (
          <div className="mb-4 p-3 bg-amber-100 text-amber-800 rounded-xl text-sm text-center">
            🔔 데모 모드로 실행 중입니다
          </div>
        )}

        {/* 헤더 */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, 0],
              y: [0, -5, 0]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-6xl mb-4"
          >
            🍳
          </motion.div>
          <h1 className="text-3xl font-bold text-[var(--color-cocoa)] font-handwriting">
            한끼했니?
          </h1>
          <p className="text-[var(--color-caramel)] text-sm mt-2">
            다시 만나서 반가워요!
          </p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-cocoa)] mb-1">
              📧 이메일
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-[var(--color-butter)] focus:border-[var(--color-coral)] focus:outline-none transition-colors bg-white"
              placeholder="example@email.com"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-cocoa)] mb-1">
              🔒 비밀번호
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-[var(--color-butter)] focus:border-[var(--color-coral)] focus:outline-none transition-colors bg-white"
              placeholder="비밀번호"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-100 text-red-700 rounded-xl text-sm"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* 로그인 버튼 */}
          <AnimatedButton
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full"
          >
            {loading ? '로그인 중...' : '🥚 로그인'}
          </AnimatedButton>
        </form>

        {/* 데모 모드 빠른 로그인 */}
        {!isSupabaseConfigured() && (
          <div className="mt-4">
            <button
              onClick={handleDemoLogin}
              className="w-full py-3 bg-[var(--color-butter)] hover:bg-[var(--color-honey)] text-[var(--color-cocoa)] rounded-2xl font-medium transition-colors"
            >
              ⚡ 데모 계정으로 바로 시작하기
            </button>
          </div>
        )}

        {/* 비밀번호 찾기 */}
        <div className="text-center mt-4">
          <Link 
            href="/auth/reset-password" 
            className="text-sm text-[var(--color-caramel)] hover:text-[var(--color-coral)]"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        {/* 구분선 */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-[var(--color-butter)]"></div>
          <span className="px-4 text-[var(--color-caramel)] text-sm">또는</span>
          <div className="flex-1 border-t border-[var(--color-butter)]"></div>
        </div>

        {/* 회원가입 링크 */}
        <div className="text-center">
          <p className="text-[var(--color-caramel)] mb-3">
            아직 계정이 없나요?
          </p>
          <Link href="/auth/signup">
            <AnimatedButton variant="secondary" className="w-full">
              🐣 회원가입하기
            </AnimatedButton>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
