'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import AnimatedButton from '@/components/AnimatedButton'
import Link from 'next/link'

interface UnresponsiveUser {
  id: string
  email: string
  nickname: string
  guardian_phone: string | null
  last_check_in: string | null
  streak: number
}

interface EmergencyAlert {
  id: string
  user_id: string
  guardian_phone: string
  message: string
  sent_at: string
  success: boolean
}

export default function AdminPage() {
  const [unresponsiveUsers, setUnresponsiveUsers] = useState<UnresponsiveUser[]>([])
  const [recentAlerts, setRecentAlerts] = useState<EmergencyAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // 48시간 미응답자 조회
      const threshold = new Date()
      threshold.setHours(threshold.getHours() - 48)

      const { data: users, error: usersError } = await (supabase
        .from('users') as any)
        .select('id, email, nickname, guardian_phone, last_check_in, streak')
        .or(`last_check_in.lt.${threshold.toISOString()},last_check_in.is.null`)
        .order('last_check_in', { ascending: true, nullsFirst: true })

      if (usersError) {
        console.error('사용자 조회 오류:', usersError)
      } else {
        setUnresponsiveUsers(users || [])
      }

      // 최근 긴급 알림 조회
      const { data: alerts, error: alertsError } = await (supabase
        .from('emergency_alerts') as any)
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(20)

      if (alertsError) {
        console.error('알림 조회 오류:', alertsError)
      } else {
        setRecentAlerts(alerts || [])
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 수동 알림 발송
  async function sendManualAlert(user: UnresponsiveUser) {
    if (!user.guardian_phone) {
      alert('보호자 연락처가 없습니다')
      return
    }

    setSending(user.id)

    try {
      const message = `[한끼했니] ${user.nickname}님이 48시간 동안 응답하지 않았습니다. 확인이 필요합니다.`

      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: user.guardian_phone,
          message,
          type: 'emergency'
        })
      })

      const result = await response.json()

      if (result.success) {
        // 알림 로그 저장
        await (supabase.from('emergency_alerts') as any).insert({
          user_id: user.id,
          guardian_phone: user.guardian_phone,
          message,
          success: true
        })

        alert('긴급 알림이 발송되었습니다')
        loadData() // 데이터 새로고침
      } else {
        alert('알림 발송에 실패했습니다')
      }
    } catch (error) {
      console.error('알림 발송 오류:', error)
      alert('오류가 발생했습니다')
    } finally {
      setSending(null)
    }
  }

  // 시간 경과 계산
  function getTimeSince(dateString: string | null): string {
    if (!dateString) return '응답 기록 없음'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays}일 ${diffHours % 24}시간 전`
    }
    return `${diffHours}시간 전`
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
    <div className="min-h-screen pb-10">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 p-4 border-b border-[var(--color-butter)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--color-cocoa)] font-handwriting">
            🔧 관리자 페이지
          </h1>
          <Link href="/">
            <AnimatedButton variant="secondary" size="sm">
              홈으로
            </AnimatedButton>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 text-center"
          >
            <div className="text-3xl mb-1">⚠️</div>
            <div className="text-2xl font-bold text-[var(--color-coral)]">
              {unresponsiveUsers.length}
            </div>
            <div className="text-xs text-[var(--color-caramel)]">미응답자</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-4 text-center"
          >
            <div className="text-3xl mb-1">📨</div>
            <div className="text-2xl font-bold text-[var(--color-cocoa)]">
              {recentAlerts.length}
            </div>
            <div className="text-xs text-[var(--color-caramel)]">최근 알림</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-4 text-center"
          >
            <div className="text-3xl mb-1">✅</div>
            <div className="text-2xl font-bold text-green-600">
              {recentAlerts.filter(a => a.success).length}
            </div>
            <div className="text-xs text-[var(--color-caramel)]">발송 성공</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-4 text-center"
          >
            <div className="text-3xl mb-1">❌</div>
            <div className="text-2xl font-bold text-red-500">
              {recentAlerts.filter(a => !a.success).length}
            </div>
            <div className="text-xs text-[var(--color-caramel)]">발송 실패</div>
          </motion.div>
        </div>

        {/* 미응답자 목록 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-[var(--color-cocoa)] mb-4 flex items-center gap-2">
            <span>⚠️</span>
            48시간 미응답자 ({unresponsiveUsers.length}명)
          </h2>

          {unresponsiveUsers.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-caramel)]">
              <div className="text-4xl mb-2">🎉</div>
              <p>미응답자가 없습니다!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unresponsiveUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {user.streak >= 16 ? '🐔' : user.streak >= 6 ? '🐥' : '🥚'}
                      </span>
                      <span className="font-bold text-[var(--color-cocoa)]">
                        {user.nickname}
                      </span>
                      <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full">
                        {getTimeSince(user.last_check_in)}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--color-caramel)] mt-1">
                      📱 {user.guardian_phone || '보호자 미등록'}
                    </div>
                  </div>

                  <AnimatedButton
                    onClick={() => sendManualAlert(user)}
                    disabled={sending === user.id || !user.guardian_phone}
                    variant="warning"
                    size="sm"
                  >
                    {sending === user.id ? '발송 중...' : '📨 알림 발송'}
                  </AnimatedButton>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* 최근 알림 로그 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <h2 className="text-xl font-bold text-[var(--color-cocoa)] mb-4 flex items-center gap-2">
            <span>📋</span>
            최근 알림 로그
          </h2>

          {recentAlerts.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-caramel)]">
              <div className="text-4xl mb-2">📭</div>
              <p>아직 발송된 알림이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * index }}
                  className={`p-3 rounded-lg text-sm ${
                    alert.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {alert.success ? '✅' : '❌'} {alert.guardian_phone}
                    </span>
                    <span className="text-xs text-[var(--color-caramel)]">
                      {new Date(alert.sent_at).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-[var(--color-caramel)] mt-1 truncate">
                    {alert.message}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
