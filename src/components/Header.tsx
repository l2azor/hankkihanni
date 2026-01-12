'use client'

import { motion } from 'framer-motion'

interface HeaderProps {
  title?: string
}

export default function Header({ title = "한끼했니?" }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full py-6 px-4 text-center relative"
    >
      {/* 로고 및 타이틀 */}
      <motion.div
        className="flex items-center justify-center gap-3"
        whileHover={{ scale: 1.02 }}
      >
        {/* 귀여운 아이콘 */}
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, 0],
            y: [0, -3, 0]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 3,
            ease: "easeInOut"
          }}
          className="text-5xl"
        >
          🍳
        </motion.div>
        
        {/* 타이틀 */}
        <h1 className="text-4xl font-black font-handwriting text-[var(--color-cocoa)] drop-shadow-sm">
          {title}
        </h1>
        
        {/* 귀여운 아이콘 */}
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            y: [0, -3, 0]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 3,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="text-5xl"
        >
          🥢
        </motion.div>
      </motion.div>

      {/* 서브타이틀 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-2 text-[var(--color-caramel)] text-sm font-medium"
      >
        사랑하는 사람의 안부를 따뜻하게 💛
      </motion.p>

      {/* 장식 요소 */}
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 4,
          ease: "easeInOut"
        }}
        className="absolute top-1/2 left-8 -translate-y-1/2 text-2xl opacity-50 hidden sm:block"
      >
        ✨
      </motion.div>
      
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 4,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute top-1/2 right-8 -translate-y-1/2 text-2xl opacity-50 hidden sm:block"
      >
        ⭐
      </motion.div>
    </motion.header>
  )
}
