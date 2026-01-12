// 체크인 API 라우트
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, response } = await request.json()

    if (!userId || !response) {
      return NextResponse.json(
        { error: '필수 파라미터가 없습니다' },
        { status: 400 }
      )
    }

    if (!['ate', 'not_ate'].includes(response)) {
      return NextResponse.json(
        { error: '잘못된 응답 값입니다' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // 1. 체크인 기록 저장
    const { error: checkInError } = await supabase
      .from('check_ins')
      .insert({
        user_id: userId,
        response: response,
        responded_at: now,
        scheduled_at: now,
        is_missed: false
      })

    if (checkInError) {
      console.error('체크인 저장 오류:', checkInError)
      return NextResponse.json(
        { error: '체크인 저장 실패' },
        { status: 500 }
      )
    }

    // 2. 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('streak, last_check_in')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('사용자 조회 오류:', userError)
      return NextResponse.json(
        { error: '사용자 정보 조회 실패' },
        { status: 500 }
      )
    }

    // 3. 스트릭 계산
    let newStreak = 1
    if (userData.last_check_in) {
      const lastDate = new Date(userData.last_check_in)
      const today = new Date()
      
      // 날짜만 비교 (시간 무시)
      lastDate.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)
      
      const diffTime = today.getTime() - lastDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        // 오늘 이미 체크인 했으면 스트릭 유지
        newStreak = userData.streak
      } else if (diffDays === 1) {
        // 어제 체크인 했으면 스트릭 증가
        newStreak = userData.streak + 1
      }
      // 2일 이상 지났으면 스트릭 리셋 (이미 1로 설정됨)
    }

    // 4. 사용자 정보 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({
        streak: newStreak,
        last_check_in: now
      })
      .eq('id', userId)

    if (updateError) {
      console.error('사용자 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: '스트릭 업데이트 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      newStreak,
      response,
      checkedAt: now
    })

  } catch (error) {
    console.error('체크인 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 오늘 체크인 상태 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId가 필요합니다' },
        { status: 400 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('check_ins')
      .select('response, responded_at')
      .eq('user_id', userId)
      .gte('responded_at', today.toISOString())
      .order('responded_at', { ascending: false })
      .limit(1)

    if (error) {
      return NextResponse.json(
        { error: '조회 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      hasCheckedIn: data && data.length > 0,
      checkIn: data?.[0] || null
    })

  } catch (error) {
    console.error('체크인 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류' },
      { status: 500 }
    )
  }
}
