// API 호출 유틸리티
import { supabase } from './supabase'
import type { CheckInResponse } from '@/types/database'

// 체크인 저장
export async function saveCheckIn(
  userId: string,
  response: CheckInResponse
): Promise<{ success: boolean; newStreak: number; error?: string }> {
  try {
    const now = new Date().toISOString()
    
    // 1. 체크인 기록 저장
    const { error: checkInError } = await (supabase
      .from('check_ins') as any)
      .insert({
        user_id: userId,
        response: response,
        responded_at: now,
        scheduled_at: now,
        is_missed: false
      })

    if (checkInError) {
      throw checkInError
    }

    // 2. 사용자 스트릭 업데이트
    const { data: userData, error: userError } = await (supabase
      .from('users') as any)
      .select('streak, last_check_in')
      .eq('id', userId)
      .single()

    if (userError) {
      throw userError
    }

    // 스트릭 계산 (연속 일수 체크)
    let newStreak = 1
    if (userData.last_check_in) {
      const lastDate = new Date(userData.last_check_in)
      const today = new Date()
      const diffTime = today.getTime() - lastDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays <= 1) {
        // 어제 또는 오늘 체크인 했으면 스트릭 유지/증가
        newStreak = userData.streak + 1
      }
      // 2일 이상 지났으면 스트릭 리셋 (이미 1로 설정됨)
    }

    // 3. 사용자 정보 업데이트
    const { error: updateError } = await (supabase
      .from('users') as any)
      .update({
        streak: newStreak,
        last_check_in: now
      })
      .eq('id', userId)

    if (updateError) {
      throw updateError
    }

    return { success: true, newStreak }
  } catch (error) {
    console.error('체크인 저장 실패:', error)
    return { 
      success: false, 
      newStreak: 0, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }
  }
}

// 오늘 체크인 여부 확인
export async function getTodayCheckIn(userId: string): Promise<{
  hasCheckedIn: boolean
  response?: CheckInResponse
}> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data, error } = await (supabase
      .from('check_ins') as any)
      .select('response')
      .eq('user_id', userId)
      .gte('responded_at', today.toISOString())
      .order('responded_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return { hasCheckedIn: false }
    }

    return { 
      hasCheckedIn: true, 
      response: data.response as CheckInResponse 
    }
  } catch {
    return { hasCheckedIn: false }
  }
}

// 사용자 정보 가져오기
export async function getUserProfile(userId: string) {
  const { data, error } = await (supabase
    .from('users') as any)
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw error
  }

  return data
}

// 보호자 연락처 업데이트
export async function updateGuardianPhone(
  userId: string,
  phone: string
): Promise<boolean> {
  const { error } = await (supabase
    .from('users') as any)
    .update({ guardian_phone: phone })
    .eq('id', userId)

  return !error
}

// 미응답자 목록 가져오기 (관리자용)
export async function getUnresponsiveUsers(hoursThreshold: number = 48) {
  const thresholdDate = new Date()
  thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold)

  const { data, error } = await (supabase
    .from('users') as any)
    .select('id, email, nickname, guardian_phone, last_check_in, streak')
    .or(`last_check_in.lt.${thresholdDate.toISOString()},last_check_in.is.null`)
    .order('last_check_in', { ascending: true, nullsFirst: true })

  if (error) {
    throw error
  }

  return data
}

// 체크인 히스토리 가져오기
export async function getCheckInHistory(userId: string, limit: number = 30) {
  const { data, error } = await (supabase
    .from('check_ins') as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw error
  }

  return data
}
