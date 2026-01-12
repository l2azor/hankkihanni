'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import AnimatedButton from '@/components/AnimatedButton'

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ResetPasswordConfirmContent />
    </Suspense>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="text-4xl"
      >
        🍳
      </motion.div>
    </div>
  )
}

function ResetPasswordConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isValidSession, setIsValidSession] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Supabase는 비밀번호 재설정 링크 클릭 시 자동으로 세션을 생성함
      if (session) {
        setIsValidSession(true)
      } else {
        // URL에서 토큰 확인 (Supabase가 처리하는 경우)
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          setError(errorDescription || '유효하지 않은 링크입니다')
        } else {
          // 세션이 없지만 에러도 없으면 잠시 대기 (Supabase가 처리 중일 수 있음)
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            if (retrySession) {
              setIsValidSession(true)
            } else {
              setError('유효하지 않거나 만료된 링크입니다. 다시 비밀번호 재설정을 요청해주세요.')
            }
            setChecking(false)
          }, 1000)
          return
        }
      }
    } catch (err) {
      console.error('세션 확인 오류:', err)
      setError('오류가 발생했습니다')
    } finally {
      setChecking(false)
    }
  }

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

    // 유효성 검사
    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다')
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSuccess(true)
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (err) {
      console.error('비밀번호 변경 오류:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('비밀번호 변경에 실패했습니다')
      }
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return <LoadingScreen />
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 max-w-md w-full text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-6xl mb-4"
          >
            ✅
          </motion.div>
          <h2 className="text-2xl font-bold text-[var(--color-cocoa)] mb-4 font-handwriting">
            비밀번호 변경 완료!
          </h2>
          <p className="text-[var(--color-caramel)] mb-6">
            새 비밀번호로 변경되었어요.
            <br />
            잠시 후 로그인 페이지로 이동합니다...
          </p>
          <Link href="/auth/login">
            <AnimatedButton variant="primary">
              바로 로그인하기
            </AnimatedButton>
          </Link>
        </motion.div>
      </div>
    )
  }

  if (!isValidSession && error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 max-w-md w-full text-center"
        >
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-[var(--color-cocoa)] mb-4 font-handwriting">
            링크가 유효하지 않아요
          </h2>
          <p className="text-[var(--color-caramel)] mb-6">
            {error}
          </p>
          <Link href="/auth/reset-password">
            <AnimatedButton variant="primary">
              다시 비밀번호 재설정 요청하기
            </AnimatedButton>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 max-w-md w-full"
      >
        {/* 헤더 */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-5xl mb-2"
          >
            🔐
          </motion.div>
          <h1 className="text-2xl font-bold text-[var(--color-cocoa)] font-handwriting">
            새 비밀번호 설정
          </h1>
          <p className="text-[var(--color-caramel)] text-sm mt-2">
            새로운 비밀번호를 입력해주세요
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 새 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-cocoa)] mb-1">
              🔒 새 비밀번호
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[var(--color-butter)] focus:border-[var(--color-coral)] focus:outline-none transition-colors bg-white"
              placeholder="6자 이상"
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-cocoa)] mb-1">
              🔒 비밀번호 확인
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-[var(--color-butter)] focus:border-[var(--color-coral)] focus:outline-none transition-colors bg-white"
              placeholder="비밀번호 재입력"
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

          {/* 제출 버튼 */}
          <AnimatedButton
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full"
          >
            {loading ? '변경 중...' : '🔑 비밀번호 변경하기'}
          </AnimatedButton>
        </form>
      </motion.div>
    </div>
  )
}
