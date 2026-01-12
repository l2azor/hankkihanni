'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface CharacterEvolutionProps {
  streak: number
  showEvolution?: boolean
}

// 스트릭에 따른 캐릭터 정보
const CHARACTERS = [
  { 
    minStreak: 0, 
    maxStreak: 5, 
    emoji: '🥚', 
    name: '알', 
    description: '따뜻하게 품어주세요',
    bgColor: 'from-amber-100 to-amber-200'
  },
  { 
    minStreak: 6, 
    maxStreak: 15, 
    emoji: '🐣', 
    name: '아기 병아리', 
    description: '삐약삐약! 열심히 크는 중',
    bgColor: 'from-yellow-200 to-amber-300'
  },
  { 
    minStreak: 16, 
    maxStreak: 30, 
    emoji: '🐥', 
    name: '병아리', 
    description: '이제 제법 의젓해졌어요',
    bgColor: 'from-yellow-300 to-orange-300'
  },
  { 
    minStreak: 31, 
    maxStreak: 60, 
    emoji: '🐔', 
    name: '닭', 
    description: '꼬끼오! 든든해졌어요',
    bgColor: 'from-orange-300 to-red-300'
  },
  { 
    minStreak: 61, 
    maxStreak: 100, 
    emoji: '🦃', 
    name: '칠면조', 
    description: '당당함의 상징!',
    bgColor: 'from-red-300 to-purple-300'
  },
  { 
    minStreak: 101, 
    maxStreak: Infinity, 
    emoji: '🦚', 
    name: '공작새', 
    description: '전설의 경지에 올랐어요!',
    bgColor: 'from-purple-300 to-blue-400'
  }
]

export default function CharacterEvolution({ streak, showEvolution = false }: CharacterEvolutionProps) {
  const [isEvolving, setIsEvolving] = useState(false)
  const [prevCharacter, setPrevCharacter] = useState<typeof CHARACTERS[0] | null>(null)

  const currentCharacter = CHARACTERS.find(
    c => streak >= c.minStreak && streak <= c.maxStreak
  ) || CHARACTERS[CHARACTERS.length - 1]

  // 진화 애니메이션 체크
  useEffect(() => {
    if (showEvolution) {
      const prevChar = CHARACTERS.find(
        c => (streak - 1) >= c.minStreak && (streak - 1) <= c.maxStreak
      )
      
      if (prevChar && prevChar.emoji !== currentCharacter.emoji) {
        setPrevCharacter(prevChar)
        setIsEvolving(true)
        setTimeout(() => setIsEvolving(false), 3000)
      }
    }
  }, [streak, showEvolution, currentCharacter.emoji])

  // 다음 진화까지 남은 일수
  const daysToNextEvolution = currentCharacter.maxStreak === Infinity 
    ? null 
    : currentCharacter.maxStreak - streak + 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 text-center relative overflow-hidden"
    >
      {/* 배경 그라데이션 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentCharacter.bgColor} opacity-30`} />

      {/* 진화 이펙트 */}
      <AnimatePresence>
        {isEvolving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-white/80"
          >
            <div className="text-center">
              <motion.div
                animate={{
                  scale: [1, 1.5, 0],
                  rotate: [0, 180, 360],
                }}
                transition={{ duration: 1 }}
                className="text-6xl mb-4"
              >
                {prevCharacter?.emoji}
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                transition={{ delay: 1, duration: 0.5 }}
                className="text-6xl"
              >
                {currentCharacter.emoji}
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-xl font-bold text-[var(--color-cocoa)] mt-4"
              >
                🎉 진화했어요! 🎉
              </motion.p>
            </div>
            
            {/* 반짝이 효과 */}
            {[...Array(20)].map((_, i) => (
              <motion.span
                key={i}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: 0,
                  y: 0 
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: (Math.random() - 0.5) * 200,
                  y: (Math.random() - 0.5) * 200,
                }}
                transition={{
                  delay: 1 + Math.random() * 0.5,
                  duration: 1,
                }}
                className="absolute text-2xl"
                style={{
                  left: '50%',
                  top: '50%',
                }}
              >
                {['✨', '⭐', '🌟', '💫'][i % 4]}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 캐릭터 표시 */}
      <div className="relative z-10">
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [-3, 3, -3],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          }}
          className="text-8xl mb-4 filter drop-shadow-lg"
        >
          {currentCharacter.emoji}
        </motion.div>

        <h3 className="text-2xl font-bold text-[var(--color-cocoa)] mb-1 font-handwriting">
          {currentCharacter.name}
        </h3>
        
        <p className="text-sm text-[var(--color-caramel)] mb-4">
          {currentCharacter.description}
        </p>

        {/* 진화 진행 바 */}
        {daysToNextEvolution && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[var(--color-caramel)] mb-1">
              <span>다음 진화까지</span>
              <span>{daysToNextEvolution}일</span>
            </div>
            <div className="h-3 bg-white/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${((streak - currentCharacter.minStreak) / (currentCharacter.maxStreak - currentCharacter.minStreak + 1)) * 100}%` 
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[var(--color-honey)] to-[var(--color-coral)] rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* 레벨 뱃지 */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute top-3 right-3 bg-white/80 rounded-full px-3 py-1 text-xs font-bold text-[var(--color-cocoa)]"
      >
        Lv.{CHARACTERS.indexOf(currentCharacter) + 1}
      </motion.div>
    </motion.div>
  )
}

// 캐릭터 목록 표시 (도감용)
export function CharacterGallery({ currentStreak }: { currentStreak: number }) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {CHARACTERS.map((char, index) => {
        const isUnlocked = currentStreak >= char.minStreak
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`
              p-4 rounded-2xl text-center relative
              ${isUnlocked 
                ? `bg-gradient-to-br ${char.bgColor}` 
                : 'bg-gray-200'
              }
            `}
          >
            <div className={`text-4xl ${!isUnlocked && 'grayscale opacity-50'}`}>
              {isUnlocked ? char.emoji : '❓'}
            </div>
            <p className="text-xs font-bold mt-2 text-[var(--color-cocoa)]">
              {isUnlocked ? char.name : '???'}
            </p>
            <p className="text-xs text-[var(--color-caramel)]">
              {char.minStreak}일~
            </p>
          </motion.div>
        )
      })}
    </div>
  )
}
