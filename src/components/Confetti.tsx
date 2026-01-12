'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ConfettiProps {
  isActive: boolean
  duration?: number
  particleCount?: number
}

// 파티클 타입
interface Particle {
  id: number
  x: number
  emoji: string
  delay: number
  duration: number
  rotation: number
  size: number
}

// 사용할 이모지들
const CONFETTI_EMOJIS = ['🎉', '⭐', '💛', '🧡', '✨', '🌟', '💫', '🎊', '🌸', '🍀', '💖', '🎈']

export default function Confetti({ 
  isActive, 
  duration = 3000, 
  particleCount = 50 
}: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (isActive) {
      // 파티클 생성
      const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // 0-100 vw
        emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        rotation: Math.random() * 720 - 360,
        size: 1 + Math.random() * 1.5
      }))
      setParticles(newParticles)

      // 지정된 시간 후 파티클 제거
      const timer = setTimeout(() => {
        setParticles([])
      }, duration)

      return () => clearTimeout(timer)
    } else {
      setParticles([])
    }
  }, [isActive, duration, particleCount])

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: `${particle.x}vw`,
                y: -50,
                opacity: 1,
                scale: 0,
                rotate: 0,
              }}
              animate={{
                y: '110vh',
                opacity: [1, 1, 0],
                scale: [0, particle.size, particle.size],
                rotate: particle.rotation,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="absolute text-2xl"
              style={{
                fontSize: `${particle.size}rem`,
              }}
            >
              {particle.emoji}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

// 클릭 시 터지는 효과
export function ClickBurst({ 
  x, 
  y, 
  onComplete 
}: { 
  x: number
  y: number
  onComplete: () => void 
}) {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i * 30) * (Math.PI / 180),
    emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length]
  }))

  useEffect(() => {
    const timer = setTimeout(onComplete, 800)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div 
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y }}
    >
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
          animate={{
            scale: [0, 1.5, 0],
            x: Math.cos(particle.angle) * 80,
            y: Math.sin(particle.angle) * 80,
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute text-xl -translate-x-1/2 -translate-y-1/2"
        >
          {particle.emoji}
        </motion.span>
      ))}
    </div>
  )
}

// 성공 축하 효과
export function SuccessCelebration({ 
  isActive,
  message = "성공!" 
}: { 
  isActive: boolean
  message?: string 
}) {
  return (
    <AnimatePresence>
      {isActive && (
        <>
          <Confetti isActive={isActive} particleCount={60} duration={4000} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                repeat: 3,
                duration: 0.5,
              }}
              className="bg-white/90 backdrop-blur-sm rounded-3xl px-8 py-6 shadow-xl"
            >
              <motion.span
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-5xl block mb-2"
              >
                🎉
              </motion.span>
              <p className="text-2xl font-bold text-[var(--color-cocoa)] font-handwriting">
                {message}
              </p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
