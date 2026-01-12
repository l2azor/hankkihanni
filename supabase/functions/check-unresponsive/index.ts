// Supabase Edge Function: 48시간 미응답자 체크 및 긴급 알림
// Cron Job으로 매 시간 실행

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Aligo API 설정 (한국 문자 발송 서비스)
const ALIGO_API_KEY = Deno.env.get('ALIGO_API_KEY') ?? ''
const ALIGO_USER_ID = Deno.env.get('ALIGO_USER_ID') ?? ''
const ALIGO_SENDER = Deno.env.get('ALIGO_SENDER') ?? ''

// Twilio 설정 (해외 서비스용)
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? ''
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') ?? ''
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') ?? ''

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 48시간 전 시간 계산
    const threshold = new Date()
    threshold.setHours(threshold.getHours() - 48)

    // 48시간 이상 미응답 사용자 조회
    const { data: unresponsiveUsers, error } = await supabase
      .from('users')
      .select('id, nickname, guardian_phone, last_check_in, email')
      .or(`last_check_in.lt.${threshold.toISOString()},last_check_in.is.null`)
      .not('guardian_phone', 'is', null)

    if (error) {
      throw error
    }

    if (!unresponsiveUsers || unresponsiveUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: '미응답자 없음' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 이미 오늘 긴급 알림 보낸 사용자 필터링
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: todayAlerts } = await supabase
      .from('emergency_alerts')
      .select('user_id')
      .gte('sent_at', todayStart.toISOString())

    const alertedUserIds = new Set(todayAlerts?.map(a => a.user_id) || [])

    const usersToAlert = unresponsiveUsers.filter(u => !alertedUserIds.has(u.id))

    // 각 미응답자의 보호자에게 문자 발송
    const results = await Promise.all(
      usersToAlert.map(async (user) => {
        if (!user.guardian_phone) return { userId: user.id, success: false, reason: 'no_guardian' }

        try {
          // 문자 메시지 내용
          const message = `[한끼했니] ${user.nickname}님이 48시간 동안 응답하지 않았습니다. 확인이 필요합니다.`

          // 한국 번호면 Aligo, 해외면 Twilio 사용
          const isKoreanNumber = user.guardian_phone.startsWith('+82') || 
                                  user.guardian_phone.startsWith('010') ||
                                  user.guardian_phone.startsWith('011')

          let success = false

          if (isKoreanNumber && ALIGO_API_KEY) {
            success = await sendAligoSMS(user.guardian_phone, message)
          } else if (TWILIO_ACCOUNT_SID) {
            success = await sendTwilioSMS(user.guardian_phone, message)
          } else {
            // API 키가 없으면 로그만 남김 (개발 환경)
            console.log(`[DEV] 문자 발송 시뮬레이션: ${user.guardian_phone} - ${message}`)
            success = true
          }

          // 긴급 알림 로그 저장
          await supabase
            .from('emergency_alerts')
            .insert({
              user_id: user.id,
              guardian_phone: user.guardian_phone,
              message: message,
              sent_at: new Date().toISOString(),
              success: success
            })

          return { userId: user.id, success }
        } catch (error) {
          console.error(`긴급 알림 실패 (${user.id}):`, error)
          return { userId: user.id, success: false, error: error.message }
        }
      })
    )

    return new Response(
      JSON.stringify({
        message: '긴급 알림 처리 완료',
        total: usersToAlert.length,
        success: results.filter(r => r.success).length,
        results
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

// Aligo SMS 발송 (한국)
async function sendAligoSMS(phone: string, message: string): Promise<boolean> {
  try {
    const formData = new FormData()
    formData.append('key', ALIGO_API_KEY)
    formData.append('user_id', ALIGO_USER_ID)
    formData.append('sender', ALIGO_SENDER)
    formData.append('receiver', phone.replace(/[^0-9]/g, ''))
    formData.append('msg', message)

    const response = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    return result.result_code === '1'
  } catch (error) {
    console.error('Aligo SMS 발송 실패:', error)
    return false
  }
}

// Twilio SMS 발송 (해외)
async function sendTwilioSMS(phone: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: phone,
          From: TWILIO_PHONE_NUMBER,
          Body: message
        })
      }
    )

    return response.ok
  } catch (error) {
    console.error('Twilio SMS 발송 실패:', error)
    return false
  }
}
