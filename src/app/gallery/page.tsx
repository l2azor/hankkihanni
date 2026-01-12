'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Header from '@/components/Header'
import { supabase } from '@/lib/supabase'

// 캐릭터 정보
const CHARACTERS = [
  { 
    minStreak: 0, 
    maxStreak: 5, 
    emoji: '🥚', 
    name: '알', 
    description: '모든 시작은 작은 알에서!\n따뜻하게 품어주세요.',
    bgColor: 'from-amber-100 to-amber-200',
    unlockMessage: '가입하면 획득!'
  },
  { 
    minStreak: 6, 
    maxStreak: 15, 
    emoji: '🐣', 
    name: '아기 병아리', 
    description: '삐약삐약!\n세상에 막 태어났어요.',
    bgColor: 'from-yellow-200 to-amber-300',
    unlockMessage: '6일 연속 달성'
  },
  { 
    minStreak: 16, 
    maxStreak: 30, 
    emoji: '🐥', 
    name: '병아리', 
    description: '이제 제법 의젓해졌어요.\n혼자서도 잘해요!',
    bgColor: 'from-yellow-300 to-orange-300',
    unlockMessage: '16일 연속 달성'
  },
  { 
    minStreak: 31, 
    maxStreak: 60, 
    emoji: '🐔', 
    name: '닭', 
    description: '꼬끼오!\n든든한 어른이 되었어요.',
    bgColor: 'from-orange-300 to-red-300',
    unlockMessage: '31일 연속 달성'
  },
  { 
    minStreak: 61, 
    maxStreak: 100, 
    emoji: '🦃', 
    name: '칠면조', 
    description: '당당함의 상징!\n누구보다 멋있어요.',
    bgColor: 'from-red-300 to-purple-300',
    unlockMessage: '61일 연속 달성'
  },
  { 
    minStreak: 101, 
    maxStreak: Infinity, 
    emoji: '🦚', 
    name: '공작새', 
    description: '전설의 경지!\n100일의 노력이 빛나요.',
    bgColor: 'from-purple-300 to-blue-400',
    unlockMessage: '101일 연속 달성'
  }
]

export default function GalleryPage() {
  const [currentStreak, setCurrentStreak] = useState(7) // 데모 기본값
  const [selectedCharacter, setSelectedCharacter] = useState<typeof CHARACTERS[0] | null>(null)

  useEffect(() => {
    loadUserStreak()
  }, [])

  async function loadUserStreak() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('streak')
          .eq('id', user.id)
          .single()

        if (profile) {
          setCurrentStreak(profile.streak)
        }
      } else {
        // 데모 모드
        const saved = localStorage.getItem('currentStreak')
        if (saved) setCurrentStreak(parseInt(saved))
      }
    } catch (error) {
      console.error('스트릭 로드 오류:', error)
    }
  }

  const currentCharacter = CHARACTERS.find(
    c => currentStreak >= c.minStreak && currentStreak <= c.maxStreak
  ) || CHARACTERS[0]

  return (
    <div className="min-h-screen pb-24">
      <Header title="캐릭터 도감" />

      <div className="max-w-lg mx-auto px-4">
        {/* 현재 캐릭터 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-6 text-center relative overflow-hidden"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${currentCharacter.bgColor} opacity-30`} />
          
          <div className="relative z-10">
            <p className="text-sm text-[var(--color-caramel)] mb-2">현재 나의 캐릭터</p>
            
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [-5, 5, -5]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut"
              }}
              className="text-8xl mb-4"
            >
              {currentCharacter.emoji}
            </motion.div>

            <h2 className="text-2xl font-bold text-[var(--color-cocoa)] font-handwriting mb-2">
              {currentCharacter.name}
            </h2>

            <div className="inline-block bg-[var(--color-honey)] text-[var(--color-cocoa)] px-4 py-1 rounded-full text-sm font-bold">
              🔥 {currentStreak}일 연속
            </div>
          </div>
        </motion.div>

        {/* 캐릭터 도감 그리드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4 mb-6"
        >
          <h3 className="text-lg font-bold text-[var(--color-cocoa)] mb-4">
            🎨 캐릭터 컬렉션
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {CHARACTERS.map((char, index) => {
              const isUnlocked = currentStreak >= char.minStreak
              const isCurrent = char === currentCharacter

              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
                  whileTap={{ scale: isUnlocked ? 0.95 : 1 }}
                  onClick={() => isUnlocked && setSelectedCharacter(char)}
                  className={`
                    p-4 rounded-2xl text-center relative transition-all
                    ${isUnlocked 
                      ? `bg-gradient-to-br ${char.bgColor} cursor-pointer` 
                      : 'bg-gray-200 cursor-not-allowed'
                    }
                    ${isCurrent ? 'ring-4 ring-[var(--color-coral)] ring-offset-2' : ''}
                  `}
                >
                  {/* 현재 뱃지 */}
                  {isCurrent && (
                    <div className="absolute -top-2 -right-2 bg-[var(--color-coral)] text-white text-xs px-2 py-0.5 rounded-full">
                      NOW
                    </div>
                  )}

                  {/* 잠금 아이콘 */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
                      <span className="text-2xl">🔒</span>
                    </div>
                  )}

                  <div className={`text-4xl mb-1 ${!isUnlocked && 'grayscale opacity-50'}`}>
                    {char.emoji}
                  </div>
                  
                  <p className="text-xs font-bold text-[var(--color-cocoa)]">
                    {isUnlocked ? char.name : '???'}
                  </p>
                  
                  <p className="text-xs text-[var(--color-caramel)] mt-1">
                    {char.minStreak}일~
                  </p>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* 진행 상황 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4 mb-6"
        >
          <h3 className="text-lg font-bold text-[var(--color-cocoa)] mb-4">
            📈 수집 진행도
          </h3>

          <div className="space-y-3">
            {CHARACTERS.map((char, index) => {
              const isUnlocked = currentStreak >= char.minStreak
              const progress = isUnlocked 
                ? 100 
                : Math.min(100, (currentStreak / char.minStreak) * 100)

              return (
                <div key={index} className="flex items-center gap-3">
                  <span className={`text-2xl ${!isUnlocked && 'grayscale opacity-50'}`}>
                    {char.emoji}
                  </span>
                  
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-[var(--color-cocoa)]">
                        {char.name}
                      </span>
                      <span className="text-[var(--color-caramel)]">
                        {isUnlocked ? '✓ 획득' : `${char.minStreak}일 필요`}
                      </span>
                    </div>
                    
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={`h-full rounded-full ${
                          isUnlocked 
                            ? 'bg-gradient-to-r from-[var(--color-honey)] to-[var(--color-coral)]' 
                            : 'bg-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* 홈으로 */}
        <div className="text-center">
          <Link href="/" className="text-[var(--color-caramel)] hover:text-[var(--color-coral)]">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>

      {/* 캐릭터 상세 모달 */}
      {selectedCharacter && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCharacter(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`bg-gradient-to-br ${selectedCharacter.bgColor} p-8 rounded-3xl max-w-sm w-full text-center`}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotate: [-10, 10, -10]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-8xl mb-4"
            >
              {selectedCharacter.emoji}
            </motion.div>

            <h2 className="text-3xl font-bold text-[var(--color-cocoa)] font-handwriting mb-2">
              {selectedCharacter.name}
            </h2>

            <p className="text-[var(--color-cocoa)] whitespace-pre-line mb-4">
              {selectedCharacter.description}
            </p>

            <div className="bg-white/50 rounded-xl p-3 mb-4">
              <p className="text-sm text-[var(--color-cocoa)]">
                🎯 <strong>{selectedCharacter.unlockMessage}</strong>
              </p>
            </div>

            <button
              onClick={() => setSelectedCharacter(null)}
              className="bg-white/80 text-[var(--color-cocoa)] px-6 py-2 rounded-full font-bold hover:bg-white transition-colors"
            >
              닫기
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
