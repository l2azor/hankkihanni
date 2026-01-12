'use client'

import { motion } from 'framer-motion'
import { useState, ReactNode } from 'react'

interface AnimatedButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  icon?: string
}

const variants = {
  primary: 'bg-gradient-to-r from-[var(--color-coral)] to-[var(--color-tangerine)] text-white',
  secondary: 'bg-gradient-to-r from-[var(--color-butter)] to-[var(--color-honey)] text-[var(--color-cocoa)]',
  success: 'bg-gradient-to-r from-[var(--color-mint)] to-emerald-400 text-emerald-900',
  warning: 'bg-gradient-to-r from-amber-300 to-orange-400 text-orange-900'
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-xl'
}

export default function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon
}: AnimatedButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
      onTapCancel={() => setIsPressed(false)}
      whileHover={{ 
        scale: disabled ? 1 : 1.05,
        y: disabled ? 0 : -2
      }}
      whileTap={{ 
        scale: disabled ? 1 : 0.95,
        y: disabled ? 0 : 2
      }}
      animate={{
        boxShadow: isPressed
          ? '0 2px 0 rgba(0, 0, 0, 0.15)'
          : '0 6px 0 rgba(0, 0, 0, 0.15)'
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-full font-bold
        inline-flex items-center justify-center gap-2
        shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        relative overflow-hidden
        ${className}
      `}
    >
      {/* 빛나는 효과 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "linear",
          repeatDelay: 3
        }}
      />
      
      {/* 아이콘 */}
      {icon && (
        <motion.span
          animate={{ 
            rotate: [0, -10, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          }}
          className="text-xl"
        >
          {icon}
        </motion.span>
      )}
      
      {/* 텍스트 */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}

// 먹었어/안먹었어 특화 버튼
export function CheckInButton({
  type,
  onClick,
  disabled = false
}: {
  type: 'ate' | 'not_ate'
  onClick: () => void
  disabled?: boolean
}) {
  const config = type === 'ate' 
    ? {
        emoji: '😋',
        text: '응, 먹었어!',
        variant: 'success' as const,
        hoverEmoji: '🍚'
      }
    : {
        emoji: '🙈',
        text: '아직 안 먹었어...',
        variant: 'secondary' as const,
        hoverEmoji: '🍳'
      }

  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95, y: 2 }}
      className={`
        ${variants[config.variant]}
        w-full py-5 px-6
        rounded-3xl font-bold text-xl
        flex items-center justify-center gap-3
        shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        relative overflow-hidden
      `}
    >
      {/* 배경 물결 효과 */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          repeat: Infinity,
          duration: 5,
          ease: "linear"
        }}
        style={{
          background: 'radial-gradient(circle, white 10%, transparent 10%)',
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* 이모지 */}
      <motion.span
        animate={{
          rotate: isHovered ? [0, -15, 15, 0] : 0,
          scale: isHovered ? [1, 1.2, 1] : 1
        }}
        transition={{ duration: 0.5 }}
        className="text-3xl"
      >
        {isHovered ? config.hoverEmoji : config.emoji}
      </motion.span>
      
      {/* 텍스트 */}
      <span className="relative z-10">{config.text}</span>
      
      {/* 클릭 시 파티클 */}
      {disabled && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-white/50"
        >
          <span className="text-2xl">✓</span>
        </motion.div>
      )}
    </motion.button>
  )
}
