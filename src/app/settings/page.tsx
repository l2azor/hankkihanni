'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AnimatedButton from '@/components/AnimatedButton'
import Header from '@/components/Header'

interface UserProfile {
  id: string
  email: string
  nickname: string
  guardian_phone: string | null
  streak: number
  last_check_in: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })
  
  const [formData, setFormData] = useState({
    nickname: '',
    guardianPhone: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 사용자 정보 로드
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        const { data: profile, error } = await (supabase
          .from('users') as any)
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (error) throw error

        setUser(profile)
        setFormData({
          nickname: profile.nickname || '',
          guardianPhone: profile.guardian_phone || ''
        })
      } catch (error) {
        console.error('프로필 로드 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'guardianPhone') {
      setFormData(prev => ({
        ...prev,
        guardianPhone: formatPhoneNumber(value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSave = async () => {
    if (!user) return
    
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await (supabase
        .from('users') as any)
        .update({
          nickname: formData.nickname,
          guardian_phone: formData.guardianPhone
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: '설정이 저장되었습니다! ✨' })
      
      // 보호자 번호가 변경되었으면 알림
      if (formData.guardianPhone !== user.guardian_phone) {
        await fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formData.guardianPhone,
            message: `[한끼했니] ${formData.nickname}님이 귀하를 안부 확인 보호자로 등록했습니다.`,
            type: 'guardian_update'
          })
        })
      }
    } catch (error) {
      console.error('저장 오류:', error)
      setMessage({ type: 'error', text: '저장에 실패했습니다' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setPasswordMessage({ type: '', text: '' })
  }

  const handlePasswordSave = async () => {
    setSavingPassword(true)
    setPasswordMessage({ type: '', text: '' })

    // 유효성 검사
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: '새 비밀번호는 6자 이상이어야 합니다' })
      setSavingPassword(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다' })
      setSavingPassword(false)
      return
    }

    try {
      // 현재 비밀번호로 재인증
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordData.currentPassword
      })

      if (signInError) {
        setPasswordMessage({ type: 'error', text: '현재 비밀번호가 올바르지 않습니다' })
        setSavingPassword(false)
        return
      }

      // 새 비밀번호로 변경
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (updateError) {
        throw new Error(updateError.message)
      }

      setPasswordMessage({ type: 'success', text: '비밀번호가 변경되었습니다! ✨' })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error('비밀번호 변경 오류:', error)
      setPasswordMessage({ type: 'error', text: '비밀번호 변경에 실패했습니다' })
    } finally {
      setSavingPassword(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
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

  return (
    <div className="min-h-screen pb-20">
      <Header title="설정" />

      <div className="max-w-lg mx-auto px-4">
        {/* 프로필 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-butter)] to-[var(--color-honey)] flex items-center justify-center text-3xl">
              {user?.streak && user.streak >= 16 ? '🐔' : user?.streak && user.streak >= 6 ? '🐥' : '🥚'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-cocoa)]">
                {user?.nickname}
              </h2>
              <p className="text-sm text-[var(--color-caramel)]">
                {user?.email}
              </p>
              <p className="text-xs text-[var(--color-coral)]">
                🔥 {user?.streak || 0}일 연속 방문 중
              </p>
            </div>
          </div>

          {/* 닉네임 수정 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--color-cocoa)] mb-1">
              😊 닉네임
            </label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[var(--color-butter)] focus:border-[var(--color-coral)] focus:outline-none transition-colors bg-white"
            />
          </div>

          {/* 보호자 연락처 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--color-cocoa)] mb-1">
              📱 보호자 연락처
            </label>
            <input
              type="tel"
              name="guardianPhone"
              value={formData.guardianPhone}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-2xl border-2 border-[var(--color-butter)] focus:border-[var(--color-coral)] focus:outline-none transition-colors bg-white"
              placeholder="010-0000-0000"
            />
            <p className="text-xs text-[var(--color-caramel)] mt-1">
              48시간 미응답 시 이 번호로 알림이 전송됩니다
            </p>
          </div>

          {/* 메시지 */}
          {message.text && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-3 rounded-xl text-sm mb-4 ${
                message.type === 'success' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {message.text}
            </motion.div>
          )}

          {/* 저장 버튼 */}
          <AnimatedButton
            onClick={handleSave}
            disabled={saving}
            variant="primary"
            className="w-full"
          >
            {saving ? '저장 중...' : '💾 변경사항 저장'}
          </AnimatedButton>
        </motion.div>

        {/* 알림 설정 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 mb-6"
        >
          <h3 className="text-lg font-bold text-[var(--color-cocoa)] mb-4">
            🔔 알림 설정
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[var(--color-cream)] rounded-xl">
              <span className="text-[var(--color-cocoa)]">푸시 알림</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-coral)]"></div>
              </label>
            </div>

            <div className="p-3 bg-[var(--color-cream)] rounded-xl">
              <span className="text-[var(--color-cocoa)] block mb-2">알림 시간대</span>
              <p className="text-sm text-[var(--color-caramel)]">
                매일 오전 11시 ~ 오후 2시 사이 랜덤 시간에 알림
              </p>
            </div>
          </div>
        </motion.div>

        {/* 보안 설정 (비밀번호 변경) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-6 mb-6"
        >
          <h3 className="text-lg font-bold text-[var(--color-cocoa)] mb-4">
            🔐 보안 설정
          </h3>
          
          <div className="space-y-4">
            {/* 현재 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-cocoa)] mb-1">
                현재 비밀번호
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[var(--color-butter)] focus:border-[var(--color-coral)] focus:outline-none transition-colors bg-white"
                placeholder="현재 비밀번호 입력"
              />
            </div>

            {/* 새 비밀번호 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-cocoa)] mb-1">
                새 비밀번호
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[var(--color-butter)] focus:border-[var(--color-coral)] focus:outline-none transition-colors bg-white"
                placeholder="6자 이상"
              />
            </div>

            {/* 새 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-cocoa)] mb-1">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 rounded-2xl border-2 border-[var(--color-butter)] focus:border-[var(--color-coral)] focus:outline-none transition-colors bg-white"
                placeholder="새 비밀번호 재입력"
              />
            </div>

            {/* 비밀번호 메시지 */}
            {passwordMessage.text && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-3 rounded-xl text-sm ${
                  passwordMessage.type === 'success' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {passwordMessage.text}
              </motion.div>
            )}

            {/* 비밀번호 변경 버튼 */}
            <AnimatedButton
              onClick={handlePasswordSave}
              disabled={savingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              variant="secondary"
              className="w-full"
            >
              {savingPassword ? '변경 중...' : '🔑 비밀번호 변경'}
            </AnimatedButton>
          </div>
        </motion.div>

        {/* 기타 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 mb-6"
        >
          <h3 className="text-lg font-bold text-[var(--color-cocoa)] mb-4">
            ⚙️ 기타
          </h3>
          
          <div className="space-y-2">
            <Link href="/history">
              <div className="flex items-center justify-between p-3 bg-[var(--color-cream)] rounded-xl hover:bg-[var(--color-butter)] transition-colors cursor-pointer">
                <span className="text-[var(--color-cocoa)]">📅 기록 보기</span>
                <span className="text-[var(--color-caramel)]">→</span>
              </div>
            </Link>

            <Link href="/gallery">
              <div className="flex items-center justify-between p-3 bg-[var(--color-cream)] rounded-xl hover:bg-[var(--color-butter)] transition-colors cursor-pointer">
                <span className="text-[var(--color-cocoa)]">🐣 캐릭터 도감</span>
                <span className="text-[var(--color-caramel)]">→</span>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* 로그아웃 */}
        <AnimatedButton
          onClick={handleLogout}
          variant="secondary"
          className="w-full"
        >
          👋 로그아웃
        </AnimatedButton>

        {/* 홈으로 */}
        <div className="text-center mt-4">
          <Link href="/" className="text-[var(--color-caramel)] hover:text-[var(--color-coral)]">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
