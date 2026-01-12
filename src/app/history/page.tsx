'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

interface CheckInRecord {
  id: string
  response: 'ate' | 'not_ate' | null
  responded_at: string
  created_at: string
}

export default function HistoryPage() {
  const [records, setRecords] = useState<CheckInRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    loadHistory()
  }, [currentMonth])

  async function loadHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // 해당 월의 기록 가져오기
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

        const { data, error } = await (supabase
          .from('check_ins') as any)
          .select('*')
          .eq('user_id', user.id)
          .gte('responded_at', startOfMonth.toISOString())
          .lte('responded_at', endOfMonth.toISOString())
          .order('responded_at', { ascending: false })

        if (!error && data) {
          setRecords(data)
        }
      } else {
        // 데모 모드 - 로컬 데이터 사용
        const demoRecords: CheckInRecord[] = []
        const today = new Date()
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          
          if (date.getMonth() === currentMonth.getMonth()) {
            demoRecords.push({
              id: `demo-${i}`,
              response: Math.random() > 0.3 ? 'ate' : 'not_ate',
              responded_at: date.toISOString(),
              created_at: date.toISOString()
            })
          }
        }
        setRecords(demoRecords)
      }
    } catch (error) {
      console.error('기록 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 캘린더 생성
  function generateCalendar() {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const calendar: (number | null)[] = []
    
    // 첫 주의 빈 칸
    for (let i = 0; i < firstDay; i++) {
      calendar.push(null)
    }
    
    // 날짜 채우기
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(day)
    }
    
    return calendar
  }

  // 특정 날짜의 기록 찾기
  function getRecordForDay(day: number) {
    return records.find(r => {
      const recordDate = new Date(r.responded_at)
      return recordDate.getDate() === day && 
             recordDate.getMonth() === currentMonth.getMonth() &&
             recordDate.getFullYear() === currentMonth.getFullYear()
    })
  }

  const calendar = generateCalendar()
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  // 월 이동
  function changeMonth(delta: number) {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + delta)
    setCurrentMonth(newDate)
  }

  return (
    <div className="min-h-screen pb-24">
      <Header title="기록" />

      <div className="max-w-lg mx-auto px-4">
        {/* 월 선택 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-[var(--color-butter)] rounded-full transition-colors"
            >
              ◀️
            </button>
            
            <h2 className="text-xl font-bold text-[var(--color-cocoa)]">
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </h2>
            
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-[var(--color-butter)] rounded-full transition-colors"
            >
              ▶️
            </button>
          </div>
        </motion.div>

        {/* 캘린더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4 mb-6"
        >
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, i) => (
              <div
                key={day}
                className={`text-center text-sm font-medium py-2 ${
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-[var(--color-caramel)]'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {calendar.map((day, index) => {
              const record = day ? getRecordForDay(day) : null
              const isToday = day === new Date().getDate() && 
                             currentMonth.getMonth() === new Date().getMonth() &&
                             currentMonth.getFullYear() === new Date().getFullYear()

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-xl text-sm
                    ${!day ? '' : isToday ? 'bg-[var(--color-coral)] text-white' : 'hover:bg-[var(--color-butter)]'}
                    ${record ? 'ring-2 ring-[var(--color-honey)]' : ''}
                  `}
                >
                  {day && (
                    <>
                      <span className={`font-medium ${isToday ? 'text-white' : 'text-[var(--color-cocoa)]'}`}>
                        {day}
                      </span>
                      {record && (
                        <span className="text-lg -mt-1">
                          {record.response === 'ate' ? '😋' : '🙈'}
                        </span>
                      )}
                    </>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* 통계 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4 mb-6"
        >
          <h3 className="text-lg font-bold text-[var(--color-cocoa)] mb-4">
            📊 이번 달 통계
          </h3>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[var(--color-coral)]">
                {records.length}
              </div>
              <div className="text-xs text-[var(--color-caramel)]">총 응답</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {records.filter(r => r.response === 'ate').length}
              </div>
              <div className="text-xs text-[var(--color-caramel)]">먹었어 😋</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-500">
                {records.filter(r => r.response === 'not_ate').length}
              </div>
              <div className="text-xs text-[var(--color-caramel)]">안먹었어 🙈</div>
            </div>
          </div>
        </motion.div>

        {/* 최근 기록 리스트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4"
        >
          <h3 className="text-lg font-bold text-[var(--color-cocoa)] mb-4">
            📝 최근 기록
          </h3>

          {loading ? (
            <div className="text-center py-4">
              <span className="text-2xl animate-spin inline-block">🍳</span>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-4 text-[var(--color-caramel)]">
              이번 달 기록이 없어요
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {records.slice(0, 10).map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-[var(--color-cream)] rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {record.response === 'ate' ? '😋' : '🙈'}
                    </span>
                    <div>
                      <div className="font-medium text-[var(--color-cocoa)]">
                        {record.response === 'ate' ? '먹었어!' : '안 먹었어...'}
                      </div>
                      <div className="text-xs text-[var(--color-caramel)]">
                        {new Date(record.responded_at).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* 홈으로 */}
        <div className="text-center mt-6">
          <Link href="/" className="text-[var(--color-caramel)] hover:text-[var(--color-coral)]">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
