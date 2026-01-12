'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface CheckInCardProps {
  nickname: string
  hasCheckedIn: boolean
  onCheckIn: (response: 'ate' | 'not_ate') => void
}

export default function CheckInCard({ nickname, hasCheckedIn, onCheckIn }: CheckInCardProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleResponse = (response: 'ate' | 'not_ate') => {
    setIsAnimating(true)
    onCheckIn(response)
    setTimeout(() => setIsAnimating(false), 1000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="card p-8 relative overflow-hidden"
    >
      {/* 배경 장식 */}
      <div className="absolute -top-4 -right-4 text-6xl opacity-20 rotate-12">🍳</div>
      <div className="absolute -bottom-4 -left-4 text-5xl opacity-20 -rotate-12">🥄</div>
      
      {/* 인사말 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-[var(--color-cocoa)] mb-2 font-handwriting">
          안녕, {nickname}! 👋
        </h2>
        <p className="text-lg text-[var(--color-caramel)]">
          오늘도 건강하게 보내고 있니?
        </p>
      </motion.div>

      {/* 안부 질문 */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        className="text-center mb-8"
      >
        <div className="inline-block bg-gradient-to-r from-[var(--color-butter)] to-[var(--color-honey)] rounded-3xl px-8 py-4 shadow-cute">
          <span className="text-2xl font-bold text-[var(--color-cocoa)] font-handwriting">
            🍚 오늘 밥은 먹었니? 🍚
          </span>
        </div>
      </motion.div>

      {/* 응답 버튼 */}
      {!hasCheckedIn ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleResponse('ate')}
            className="btn-cute btn-success text-xl flex items-center justify-center gap-2"
          >
            <span className="text-2xl">😋</span>
            응, 먹었어!
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleResponse('not_ate')}
            className="btn-cute btn-secondary text-xl flex items-center justify-center gap-2"
          >
            <span className="text-2xl">🙈</span>
            아직 안 먹었어...
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 bg-[var(--color-mint)] text-[#004D40] rounded-full px-6 py-3 text-xl font-bold">
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-3xl"
            >
              ✨
            </motion.span>
            오늘의 안부 확인 완료!
            <motion.span
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-3xl"
            >
              ✨
            </motion.span>
          </div>
        </motion.div>
      )}

      {/* 애니메이션 효과 */}
      {isAnimating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          {[...Array(8)].map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos(i * 45 * Math.PI / 180) * 100,
                y: Math.sin(i * 45 * Math.PI / 180) * 100,
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute text-3xl"
            >
              {['🎉', '⭐', '💛', '🧡', '✨', '🌟', '💫', '🎊'][i]}
            </motion.span>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
