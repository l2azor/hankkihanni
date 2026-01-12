// Supabase Edge Function: 매일 랜덤 시간에 알림 전송
// 이 함수는 Supabase Cron Job으로 매시간 실행됩니다.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

serve(async (req) => {
  // CORS 프리플라이트
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const currentHour = now.getHours()

    // 알림 시간 범위: 오전 11시 ~ 오후 1시 (11:00 - 13:59)
    if (currentHour < 11 || currentHour > 13) {
      return new Response(
        JSON.stringify({ message: '알림 시간이 아닙니다', currentHour }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 오늘 아직 알림을 받지 않은 사용자 조회
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, nickname, push_subscription')
      .not('push_subscription', 'is', null)

    if (usersError) {
      throw usersError
    }

    // 오늘 이미 체크인한 사용자 필터링
    const { data: todayCheckIns } = await supabase
      .from('check_ins')
      .select('user_id')
      .gte('created_at', todayStart.toISOString())

    const checkedInUserIds = new Set(todayCheckIns?.map(c => c.user_id) || [])

    // 알림 보낼 사용자 필터링
    const usersToNotify = users?.filter(u => !checkedInUserIds.has(u.id)) || []

    // 랜덤하게 일부 사용자에게만 알림 (시간대별 분산)
    // 각 시간대에 약 33%의 사용자에게 알림
    const randomUsers = usersToNotify.filter(() => Math.random() < 0.33)

    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''

    const notifications = randomUsers.map(async (user) => {
      if (!user.push_subscription) return null

      try {
        const subscription: PushSubscription = JSON.parse(user.push_subscription)
        
        const payload = JSON.stringify({
          title: '한끼했니? 🍳',
          body: `${user.nickname}님, 오늘 밥은 드셨나요?`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: 'check-in-reminder',
          data: {
            url: '/',
            userId: user.id
          }
        })

        // Web Push 전송 (web-push 라이브러리 대신 직접 구현)
        const response = await sendWebPush(
          subscription,
          payload,
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY
        )

        // 알림 로그 저장
        await supabase
          .from('notification_logs')
          .insert({
            user_id: user.id,
            type: 'reminder',
            sent_at: new Date().toISOString(),
            success: response.ok
          })

        return { userId: user.id, success: response.ok }
      } catch (error) {
        console.error(`알림 전송 실패 (${user.id}):`, error)
        return { userId: user.id, success: false, error }
      }
    })

    const results = await Promise.all(notifications)

    return new Response(
      JSON.stringify({
        message: '알림 전송 완료',
        sent: results.filter(r => r?.success).length,
        total: randomUsers.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('에러:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Web Push 전송 함수 (간소화된 버전)
async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<Response> {
  // 실제 구현에서는 web-push 라이브러리나
  // VAPID 서명 로직이 필요합니다.
  // 여기서는 구조만 보여줍니다.
  
  return await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TTL': '86400',
    },
    body: payload
  })
}
