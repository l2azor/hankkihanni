'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import AnimatedButton from '@/components/AnimatedButton'

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    guardianPhone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('')
  }

  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '')
    
    // 한국 전화번호 형식으로 포맷
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData(prev => ({
      ...prev,
      guardianPhone: formatted
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 유효성 검사
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다')
      setLoading(false)
      return
    }

    if (!formData.guardianPhone || formData.guardianPhone.length < 12) {
      setError('보호자 연락처를 정확히 입력해주세요')
      setLoading(false)
      return
    }

    // 데모 모드 체크
    if (!isSupabaseConfigured()) {
      // 데모 모드에서는 로컬스토리지에 저장하고 성공 처리
      localStorage.setItem('demoUser', JSON.stringify({
        email: formData.email,
        nickname: formData.nickname,
        guardianPhone: formData.guardianPhone,
        streak: 0,
        createdAt: new Date().toISOString()
      }))
      
      setSuccess(true)
      setLoading(false)
      return
    }

    try {
      // 1. Supabase Auth로 회원가입
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            nickname: formData.nickname,
            guardian_phone: formData.guardianPhone
          }
        }
      })

      if (authError) {
        throw new Error(authError.message || '회원가입 중 오류가 발생했습니다')
      }

      if (authData.user) {
        // 2. users 테이블에 추가 정보 저장
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            nickname: formData.nickname,
            guardian_phone: formData.guardianPhone,
            streak: 0
          })

        if (profileError) {
          console.error('프로필 저장 오류:', profileError)
        }

        // 3. 보호자에게 안내 문자 발송
        try {
          await fetch('/api/sms/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: formData.guardianPhone,
              message: `[한끼했니] ${formData.nickname}님이 귀하를 안부 확인 보호자로 등록했습니다. 앞으로 ${formData.nickname}님의 안부 상태를 알려드릴게요.`,
              type: 'welcome'
            })
          })
        } catch (smsError) {
          console.error('SMS 발송 오류:', smsError)
        }

        setSuccess(true)
      } else {
        // user가 null인 경우 (이메일 인증 대기 중일 수 있음)
        setSuccess(true)
      }
    } catch (err) {
      console.error('회원가입 오류:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError(String((err as { message: unknown }).message))
      } else {
        setError('회원가입에 실패했습니다')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    const isDemo = !isSupabaseConfigured()
    
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
            {isDemo ? '🎉' : '📧'}
          </motion.div>
          <h2 className="text-2xl font-bold text-[var(--color-cocoa)] mb-4 font-handwriting">
            {isDemo ? '가입 완료! (데모 모드)' : '이메일을 확인해주세요!'}
          </h2>
          <p className="text-[var(--color-caramel)] mb-6">
            {isDemo ? (
              <>
                <strong>{formData.nickname}</strong>님, 환영합니다!
                <br />
                <span className="text-sm">데모 모드에서는 로컬에 데이터가 저장됩니다.</span>
              </>
            ) : (
              <>
                <strong>{formData.email}</strong>로 인증 메일을 보냈어요.
                <br />
                메일의 링크를 클릭하면 가입이 완료됩니다!
              </>
            )}
          </p>
          {!isDemo && (
            <p className="text-sm text-[var(--color-caramel)] mb-4">
              📱 보호자 <strong>{formData.guardianPhone}</strong>님께도
              <br />안내 문자를 보냈어요!
            </p>
          )}
          <Link href={isDemo ? '/' : '/auth/login'}>
            <AnimatedButton variant={isDemo ? 'primary' : 'secondary'}>
              {isDemo ? '🏠 홈으로 이동' : '로그인 페이지로 이동'}
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
        {/* 데모 모드 알림 */}
        {!isSupabaseConfigured() && (
          <div className="mb-4 p-3 bg-amber-100 text-amber-800 rounded-xl text-sm text-center">
            🔔 데모 모드 - 데이터가 브라우저에 저장됩니다
          </div>
        )}

        {/* 헤더 */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-5xl mb-2"
          >
            🍳
          </motion.div>
          <h1 className="text-3xl font-bold text-[var(--color-cocoa)] font-handwriting">
            회원가입
          </h1>
          <p className="text-[var(--color-caramel)] text-sm mt-2">
            사랑하는 사람과 연결되세요
          </p>
        </div>

        {/* 폼 */}
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

          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-cocoa)] mb-1">
              😊 닉네임
            </label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              required
              maxLength={20}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[var(--color-butter)] focus:border-[var(--color-coral)] focus:outline-none transition-colors bg-white"
              placeholder="우리 아이, 엄마 등"
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

          {/* 보호자 연락처 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-cocoa)] mb-1">
              📱 보호자 연락처 <span className="text-[var(--color-coral)]">*필수</span>
            </label>
            <input
              type="tel"
              name="guardianPhone"
              value={formData.guardianPhone}
              onChange={handlePhoneChange}
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-[var(--color-butter)] focus:border-[var(--color-coral)] focus:outline-none transition-colors bg-white"
              placeholder="010-0000-0000"
            />
            <p className="text-xs text-[var(--color-caramel)] mt-1">
              미응답 시 이 번호로 알림이 전송됩니다
            </p>
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
            {loading ? '가입 중...' : '🥚 가입하고 시작하기'}
          </AnimatedButton>
        </form>

        {/* 로그인 링크 */}
        <p className="text-center mt-6 text-[var(--color-caramel)]">
          이미 계정이 있나요?{' '}
          <Link href="/auth/login" className="text-[var(--color-coral)] font-bold hover:underline">
            로그인
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
