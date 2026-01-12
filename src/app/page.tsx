'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import StreakCounter from '@/components/StreakCounter'
import CharacterEvolution from '@/components/CharacterEvolution'
import { CheckInButton } from '@/components/AnimatedButton'
import { SuccessCelebration } from '@/components/Confetti'
import { supabase } from '@/lib/supabase'
import { registerServiceWorker, requestNotificationPermission } from '@/lib/push-notification'

// 데모용 목업 데이터 (Supabase 연동 전)
const DEMO_USER = {
  id: 'demo-user-1',
  nickname: '우리 아이',
  streak: 7,
  lastCheckIn: null as string | null,
}

export default function Home() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState(DEMO_USER)
  const [hasCheckedIn, setHasCheckedIn] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showEvolution, setShowEvolution] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // 초기화
  useEffect(() => {
    initializeApp()
    
    // 알림 클릭으로 온 경우 처리
    const action = searchParams.get('action')
    if (action === 'ate' || action === 'not-ate') {
      handleCheckIn(action === 'ate' ? 'ate' : 'not_ate')
    }
  }, [searchParams])

  async function initializeApp() {
    try {
      // Service Worker 등록
      await registerServiceWorker()

      // 로그인 상태 확인
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        setIsLoggedIn(true)
        
        // 사용자 프로필 로드
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profile) {
          setUser({
            id: profile.id,
            nickname: profile.nickname,
            streak: profile.streak,
            lastCheckIn: profile.last_check_in
          })
        }

        // 오늘 체크인 여부 확인
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data: todayCheckIn } = await supabase
          .from('check_ins')
          .select('id')
          .eq('user_id', authUser.id)
          .gte('responded_at', today.toISOString())
          .limit(1)

        if (todayCheckIn && todayCheckIn.length > 0) {
          setHasCheckedIn(true)
        }

        // 푸시 알림 권한 요청
        await requestNotificationPermission()
      } else {
        // 로그인 안 된 경우 로컬스토리지 사용 (데모)
        loadDemoData()
      }
    } catch (error) {
      console.error('초기화 오류:', error)
      loadDemoData()
    } finally {
      setIsLoading(false)
    }
  }

  function loadDemoData() {
    const today = new Date().toDateString()
    const savedCheckIn = localStorage.getItem('lastCheckInDate')
    
    if (savedCheckIn === today) {
      setHasCheckedIn(true)
    }

    const savedStreak = localStorage.getItem('currentStreak')
    if (savedStreak) {
      setUser(prev => ({ ...prev, streak: parseInt(savedStreak) }))
    }

    const savedLastCheckIn = localStorage.getItem('lastCheckInTime')
    if (savedLastCheckIn) {
      setUser(prev => ({ ...prev, lastCheckIn: savedLastCheckIn }))
    }
  }

  async function handleCheckIn(response: 'ate' | 'not_ate') {
    const now = new Date().toISOString()
    const today = new Date().toDateString()
    const previousStreak = user.streak

    // 낙관적 업데이트
    const newStreak = user.streak + 1
    setUser(prev => ({ ...prev, streak: newStreak, lastCheckIn: now }))
    setHasCheckedIn(true)

    // 축하 효과
    setShowCelebration(true)
    setTimeout(() => {
      setShowCelebration(false)
      // 진화 체크
      checkEvolution(previousStreak, newStreak)
    }, 3000)

    if (isLoggedIn) {
      // Supabase에 저장
      try {
        await fetch('/api/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            response
          })
        })
      } catch (error) {
        console.error('체크인 저장 오류:', error)
      }
    } else {
      // 로컬스토리지에 저장 (데모)
      localStorage.setItem('lastCheckInDate', today)
      localStorage.setItem('lastCheckInTime', now)
      localStorage.setItem('lastResponse', response)
      localStorage.setItem('currentStreak', newStreak.toString())
    }

    console.log(`체크인 완료! 응답: ${response === 'ate' ? '먹었어' : '안 먹었어'}`)
  }

  function checkEvolution(prevStreak: number, newStreak: number) {
    const milestones = [6, 16, 31, 61, 101]
    for (const milestone of milestones) {
      if (prevStreak < milestone && newStreak >= milestone) {
        setShowEvolution(true)
        setTimeout(() => setShowEvolution(false), 4000)
        break
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            rotate: { repeat: Infinity, duration: 2, ease: "linear" },
            scale: { repeat: Infinity, duration: 1 }
          }}
          className="text-6xl"
        >
          🍳
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 배경 장식 */}
      <BackgroundDecoration />

      {/* 축하 효과 */}
      <SuccessCelebration 
        isActive={showCelebration} 
        message={hasCheckedIn ? "오늘도 안부 확인 완료!" : "성공!"}
      />

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 max-w-lg mx-auto px-4 pb-24">
        <Header />

        {/* 로그인 안내 (데모 모드) */}
        {!isLoggedIn && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-[var(--color-butter)]/50 rounded-xl text-center text-sm"
          >
            <span className="text-[var(--color-cocoa)]">
              🔔 지금은 데모 모드예요.{' '}
              <Link href="/auth/login" className="text-[var(--color-coral)] font-bold underline">
                로그인
              </Link>
              하면 모든 기능을 사용할 수 있어요!
            </span>
          </motion.div>
        )}

        {/* 캐릭터 진화 */}
        <div className="mb-6">
          <CharacterEvolution 
            streak={user.streak} 
            showEvolution={showEvolution}
          />
        </div>

        {/* 스트릭 카운터 */}
        <div className="mb-6">
          <StreakCounter 
            streak={user.streak} 
            lastCheckIn={user.lastCheckIn} 
          />
        </div>

        {/* 안부 확인 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card p-6 mb-6 relative overflow-hidden"
        >
          {/* 배경 장식 */}
          <div className="absolute -top-4 -right-4 text-6xl opacity-20 rotate-12">🍳</div>
          
          {/* 인사말 */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[var(--color-cocoa)] mb-2 font-handwriting">
              안녕, {user.nickname}! 👋
            </h2>
            <p className="text-[var(--color-caramel)]">
              오늘도 건강하게 보내고 있니?
            </p>
          </div>

          {/* 안부 질문 */}
          <div className="text-center mb-6">
            <div className="inline-block bg-gradient-to-r from-[var(--color-butter)] to-[var(--color-honey)] rounded-3xl px-6 py-3 shadow-cute">
              <span className="text-xl font-bold text-[var(--color-cocoa)] font-handwriting">
                🍚 오늘 밥은 먹었니? 🍚
              </span>
            </div>
          </div>

          {/* 응답 버튼 */}
          {!hasCheckedIn ? (
            <div className="space-y-3">
              <CheckInButton
                type="ate"
                onClick={() => handleCheckIn('ate')}
              />
              <CheckInButton
                type="not_ate"
                onClick={() => handleCheckIn('not_ate')}
              />
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-center p-4 bg-[var(--color-mint)] rounded-2xl"
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-4xl block mb-2"
              >
                ✨
              </motion.span>
              <p className="text-lg font-bold text-emerald-800">
                오늘의 안부 확인 완료!
              </p>
              <p className="text-sm text-emerald-600 mt-1">
                내일 또 만나요 💛
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* 팁 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-[var(--color-caramel)]">
            <span className="text-lg">💡</span>
            <span>매일 안부를 확인하면 캐릭터가 성장해요!</span>
          </div>
        </motion.div>
      </div>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[var(--color-butter)] py-3 px-4 z-20">
        <div className="max-w-lg mx-auto flex justify-around">
          <Link href="/" className="flex flex-col items-center text-[var(--color-coral)]">
            <span className="text-2xl">🏠</span>
            <span className="text-xs font-medium">홈</span>
          </Link>
          <Link href="/history" className="flex flex-col items-center text-[var(--color-caramel)] hover:text-[var(--color-coral)]">
            <span className="text-2xl">📅</span>
            <span className="text-xs font-medium">기록</span>
          </Link>
          <Link href="/gallery" className="flex flex-col items-center text-[var(--color-caramel)] hover:text-[var(--color-coral)]">
            <span className="text-2xl">🐣</span>
            <span className="text-xs font-medium">도감</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center text-[var(--color-caramel)] hover:text-[var(--color-coral)]">
            <span className="text-2xl">⚙️</span>
            <span className="text-xs font-medium">설정</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}

// 배경 장식 컴포넌트
function BackgroundDecoration() {
  const decorations = [
    { emoji: '🍚', size: 'text-4xl', position: 'top-20 left-10', delay: 0 },
    { emoji: '🥄', size: 'text-3xl', position: 'top-32 right-8', delay: 0.5 },
    { emoji: '🌸', size: 'text-2xl', position: 'top-60 left-4', delay: 1 },
    { emoji: '☁️', size: 'text-5xl', position: 'bottom-40 right-4', delay: 1.5 },
    { emoji: '🌤️', size: 'text-4xl', position: 'top-16 right-1/4', delay: 2 },
    { emoji: '🍃', size: 'text-2xl', position: 'bottom-60 left-8', delay: 2.5 },
  ]

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {decorations.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 0.4, 
            scale: 1,
            y: [0, -10, 0],
          }}
          transition={{
            delay: item.delay,
            y: {
              repeat: Infinity,
              duration: 3 + index * 0.5,
              ease: "easeInOut"
            }
          }}
          className={`absolute ${item.position} ${item.size}`}
        >
          {item.emoji}
        </motion.div>
      ))}

      {/* 배경 패턴 */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FF8A65' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
