'use client'

import { motion } from 'framer-motion'

interface StreakCounterProps {
  streak: number
  lastCheckIn?: string | null
}

export default function StreakCounter({ streak, lastCheckIn }: StreakCounterProps) {
  // Streak에 따른 뱃지/레벨 결정
  const getStreakInfo = (count: number) => {
    if (count >= 100) return { emoji: '👑', title: '전설의 챔피언', color: 'from-yellow-400 to-amber-500' }
    if (count >= 50) return { emoji: '🏆', title: '골드 챔피언', color: 'from-yellow-300 to-yellow-500' }
    if (count >= 30) return { emoji: '🥇', title: '실버 마스터', color: 'from-gray-300 to-gray-400' }
    if (count >= 14) return { emoji: '🎖️', title: '브론즈 루키', color: 'from-orange-300 to-orange-400' }
    if (count >= 7) return { emoji: '⭐', title: '일주일 달성!', color: 'from-[var(--color-butter)] to-[var(--color-honey)]' }
    if (count >= 3) return { emoji: '🌱', title: '새싹', color: 'from-green-200 to-green-300' }
    return { emoji: '🥚', title: '시작이 반!', color: 'from-[var(--color-cream)] to-[var(--color-butter)]' }
  }

  const streakInfo = getStreakInfo(streak)

  // 최근 체크인 날짜 포맷
  const formatLastCheckIn = (dateString: string | null | undefined) => {
    if (!dateString) return '아직 없음'
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = today.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '어제'
    return `${diffDays}일 전`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="card p-6 text-center relative overflow-hidden"
    >
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-5">
        {[...Array(20)].map((_, i) => (
          <span
            key={i}
            className="absolute text-2xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          >
            {['🔥', '⭐', '💛'][i % 3]}
          </span>
        ))}
      </div>

      {/* 타이틀 */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-4"
      >
        <span className="text-sm font-medium text-[var(--color-caramel)] uppercase tracking-wider">
          🔥 연속 방문 기록
        </span>
      </motion.div>

      {/* 스트릭 카운터 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
        className="mb-4"
      >
        <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br ${streakInfo.color} shadow-lg`}>
          <div className="text-center">
            <motion.span
              key={streak}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-black text-[var(--color-cocoa)] block"
            >
              {streak}
            </motion.span>
            <span className="text-xs font-medium text-[var(--color-cocoa)] opacity-70">일</span>
          </div>
        </div>
      </motion.div>

      {/* 뱃지 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mb-4"
      >
        <div className="streak-badge inline-flex">
          <motion.span
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-2xl"
          >
            {streakInfo.emoji}
          </motion.span>
          <span className="text-[var(--color-cocoa)] font-bold">
            {streakInfo.title}
          </span>
        </div>
      </motion.div>

      {/* 진행 바 (다음 레벨까지) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mb-3"
      >
        <div className="flex justify-between text-xs text-[var(--color-caramel)] mb-1">
          <span>다음 목표까지</span>
          <span>{getNextMilestone(streak) - streak}일</span>
        </div>
        <div className="h-2 bg-[var(--color-butter)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${getProgressPercentage(streak)}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
            className="h-full bg-gradient-to-r from-[var(--color-coral)] to-[var(--color-tangerine)] rounded-full"
          />
        </div>
      </motion.div>

      {/* 마지막 체크인 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-xs text-[var(--color-caramel)]"
      >
        마지막 안부: {formatLastCheckIn(lastCheckIn)}
      </motion.div>
    </motion.div>
  )
}

// 다음 마일스톤 계산
function getNextMilestone(current: number): number {
  const milestones = [3, 7, 14, 30, 50, 100, 365]
  for (const milestone of milestones) {
    if (current < milestone) return milestone
  }
  return current + 100 // 365일 이상이면 +100일 단위
}

// 진행률 계산
function getProgressPercentage(current: number): number {
  const milestones = [0, 3, 7, 14, 30, 50, 100, 365]
  for (let i = 0; i < milestones.length - 1; i++) {
    if (current < milestones[i + 1]) {
      const prevMilestone = milestones[i]
      const nextMilestone = milestones[i + 1]
      return ((current - prevMilestone) / (nextMilestone - prevMilestone)) * 100
    }
  }
  return 100
}
