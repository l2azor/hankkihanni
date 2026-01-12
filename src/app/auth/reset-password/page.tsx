'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import AnimatedButton from '@/components/AnimatedButton'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!isSupabaseConfigured()) {
      setError('데모 모드에서는 비밀번호 재설정이 불가능합니다')
      setLoading(false)
      return
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      })

      if (resetError) {
        throw new Error(resetError.message)
      }

      setSent(true)
    } catch (err) {
      console.error('비밀번호 재설정 오류:', err)
      if (err instanceof Error) {
        if (err.message.includes('User not found')) {
          setError('등록되지 않은 이메일입니다')
        } else {
          setError(err.message)
        }
      } else {
        setError('비밀번호 재설정 요청에 실패했습니다')
      }
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
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
            📧
          </motion.div>
          <h2 className="text-2xl font-bold text-[var(--color-cocoa)] mb-4 font-handwriting">
            이메일을 확인해주세요!
          </h2>
          <p className="text-[var(--color-caramel)] mb-6">
            <strong>{email}</strong>로 비밀번호 재설정 링크를 보냈어요.
            <br />
            메일의 링크를 클릭해서 새 비밀번호를 설정하세요!
          </p>
          <p className="text-sm text-[var(--color-caramel)] mb-6">
            📌 메일이 안 보이면 스팸함을 확인해주세요
          </p>
          <Link href="/auth/login">
            <AnimatedButton variant="secondary">
              로그인 페이지로 돌아가기
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
            🔔 데모 모드에서는 비밀번호 재설정이 불가능합니다
          </div>
        )}

        {/* 헤더 */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-5xl mb-2"
          >
            🔑
          </motion.div>
          <h1 className="text-2xl font-bold text-[var(--color-cocoa)] font-handwriting">
            비밀번호 찾기
          </h1>
          <p className="text-[var(--color-caramel)] text-sm mt-2">
            가입한 이메일로 재설정 링크를 보내드려요
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-cocoa)] mb-1">
              📧 가입한 이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-[var(--color-butter)] focus:border-[var(--color-coral)] focus:outline-none transition-colors bg-white"
              placeholder="example@email.com"
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
            disabled={loading || !isSupabaseConfigured()}
            className="w-full"
          >
            {loading ? '발송 중...' : '📨 재설정 링크 받기'}
          </AnimatedButton>
        </form>

        {/* 로그인 링크 */}
        <p className="text-center mt-6 text-[var(--color-caramel)]">
          비밀번호가 기억났나요?{' '}
          <Link href="/auth/login" className="text-[var(--color-coral)] font-bold hover:underline">
            로그인
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
