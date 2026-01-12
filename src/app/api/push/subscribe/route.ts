// 푸시 알림 구독 API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, subscription } = await request.json()

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: '필수 파라미터가 없습니다' },
        { status: 400 }
      )
    }

    // 사용자의 푸시 구독 정보 저장
    const { error } = await supabase
      .from('users')
      .update({
        push_subscription: JSON.stringify(subscription)
      })
      .eq('id', userId)

    if (error) {
      console.error('푸시 구독 저장 오류:', error)
      return NextResponse.json(
        { error: '구독 저장 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '푸시 알림 구독 완료'
    })

  } catch (error) {
    console.error('푸시 구독 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류' },
      { status: 500 }
    )
  }
}

// 구독 해제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId가 필요합니다' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('users')
      .update({ push_subscription: null })
      .eq('id', userId)

    if (error) {
      return NextResponse.json(
        { error: '구독 해제 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '푸시 알림 구독 해제됨'
    })

  } catch (error) {
    console.error('푸시 구독 해제 오류:', error)
    return NextResponse.json(
      { error: '서버 오류' },
      { status: 500 }
    )
  }
}
