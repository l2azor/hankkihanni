// SMS 발송 API (보호자 알림용)
import { NextRequest, NextResponse } from 'next/server'

// Aligo API 설정
const ALIGO_API_KEY = process.env.ALIGO_API_KEY
const ALIGO_USER_ID = process.env.ALIGO_USER_ID
const ALIGO_SENDER = process.env.ALIGO_SENDER

// Twilio 설정
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

export async function POST(request: NextRequest) {
  try {
    const { phone, message, type } = await request.json()

    if (!phone || !message) {
      return NextResponse.json(
        { error: '전화번호와 메시지가 필요합니다' },
        { status: 400 }
      )
    }

    // 한국 번호 체크
    const isKoreanNumber = phone.startsWith('+82') || 
                          phone.startsWith('010') ||
                          phone.startsWith('011') ||
                          phone.match(/^01[0-9]/)

    let success = false
    let provider = 'none'

    if (isKoreanNumber && ALIGO_API_KEY) {
      // Aligo로 발송 (한국)
      success = await sendAligoSMS(phone, message)
      provider = 'aligo'
    } else if (TWILIO_ACCOUNT_SID) {
      // Twilio로 발송 (해외)
      success = await sendTwilioSMS(phone, message)
      provider = 'twilio'
    } else {
      // 개발 환경 - 로그만 출력
      console.log(`[DEV SMS] To: ${phone}, Message: ${message}, Type: ${type}`)
      success = true
      provider = 'dev'
    }

    return NextResponse.json({
      success,
      provider,
      message: success ? 'SMS 발송 완료' : 'SMS 발송 실패'
    })

  } catch (error) {
    console.error('SMS 발송 오류:', error)
    return NextResponse.json(
      { error: '서버 오류' },
      { status: 500 }
    )
  }
}

// Aligo SMS 발송
async function sendAligoSMS(phone: string, message: string): Promise<boolean> {
  try {
    // 한국 번호 정규화
    let normalizedPhone = phone.replace(/[^0-9]/g, '')
    if (normalizedPhone.startsWith('82')) {
      normalizedPhone = '0' + normalizedPhone.slice(2)
    }

    const formData = new FormData()
    formData.append('key', ALIGO_API_KEY!)
    formData.append('user_id', ALIGO_USER_ID!)
    formData.append('sender', ALIGO_SENDER!)
    formData.append('receiver', normalizedPhone)
    formData.append('msg', message)

    const response = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    console.log('Aligo 응답:', result)
    
    return result.result_code === '1'
  } catch (error) {
    console.error('Aligo SMS 오류:', error)
    return false
  }
}

// Twilio SMS 발송
async function sendTwilioSMS(phone: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: phone,
          From: TWILIO_PHONE_NUMBER!,
          Body: message
        })
      }
    )

    const result = await response.json()
    console.log('Twilio 응답:', result)

    return response.ok
  } catch (error) {
    console.error('Twilio SMS 오류:', error)
    return false
  }
}
