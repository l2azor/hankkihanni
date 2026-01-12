# 🍳 한끼했니?

> 사랑하는 사람의 안부를 확인하는 귀여운 방법

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?logo=supabase)

## ✨ 주요 기능

### 📱 핵심 기능
- 🔔 **매일 랜덤 안부 알림** - 오전 11시 ~ 오후 2시 사이 랜덤 시간에 "밥 먹었니?" 알림
- 🍚 **간편한 응답** - [먹었어] / [안 먹었어] 버튼으로 원클릭 응답
- 🔥 **연속 방문 스트릭** - 매일 응답하면 스트릭이 쌓여요
- 🐣 **캐릭터 진화** - 스트릭에 따라 캐릭터가 성장! (🥚→🐣→🐥→🐔→🦃→🦚)

### 🚨 안전 기능
- ⏰ **48시간 미응답 감지** - 응답이 없으면 보호자에게 자동 알림
- 📱 **보호자 문자 발송** - Aligo/Twilio API 연동
- 👨‍👩‍👧 **관리자 대시보드** - 미응답자 모니터링

### 🎮 게이미피케이션
- ✨ **Confetti 효과** - 응답 시 축하 애니메이션
- 🏆 **뱃지 시스템** - 연속 방문 달성 뱃지
- 📊 **히스토리** - 월별 캘린더로 기록 확인

## 🎨 디자인

파스텔 톤의 **노란색**과 **오렌지색**을 사용한 따뜻하고 귀여운 디자인

| 컬러 | 용도 |
|------|------|
| 🧈 #FFE4A0 | 버터 노란색 (배경) |
| 🍯 #FFD54F | 꿀색 (포인트) |
| 🍑 #FFAB91 | 복숭아색 (서브) |
| 🧡 #FF8A65 | 코랄 오렌지 (강조) |

## 📁 프로젝트 구조

```
hankkihanni/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 메인 페이지
│   │   ├── layout.tsx            # 루트 레이아웃
│   │   ├── globals.css           # 글로벌 스타일
│   │   ├── auth/
│   │   │   ├── login/page.tsx    # 로그인
│   │   │   ├── signup/page.tsx   # 회원가입
│   │   │   └── callback/route.ts # 이메일 인증 콜백
│   │   ├── settings/page.tsx     # 설정 페이지
│   │   ├── history/page.tsx      # 기록 페이지
│   │   ├── gallery/page.tsx      # 캐릭터 도감
│   │   ├── admin/page.tsx        # 관리자 페이지
│   │   └── api/
│   │       ├── check-in/route.ts     # 체크인 API
│   │       ├── push/subscribe/route.ts # 푸시 구독
│   │       └── sms/send/route.ts     # SMS 발송
│   ├── components/
│   │   ├── Header.tsx            # 헤더
│   │   ├── CheckInCard.tsx       # 안부 확인 카드
│   │   ├── StreakCounter.tsx     # 스트릭 카운터
│   │   ├── CharacterEvolution.tsx # 캐릭터 진화
│   │   ├── AnimatedButton.tsx    # 애니메이션 버튼
│   │   └── Confetti.tsx          # 축하 효과
│   ├── lib/
│   │   ├── supabase.ts           # Supabase 클라이언트
│   │   ├── api.ts                # API 유틸리티
│   │   └── push-notification.ts  # 푸시 알림 유틸
│   └── types/
│       └── database.ts           # DB 타입 정의
├── supabase/
│   ├── schema.sql                # 기본 DB 스키마
│   ├── schema-v2.sql             # 확장 스키마 (알림, 로그)
│   └── functions/
│       ├── send-reminder/        # 알림 발송 Edge Function
│       └── check-unresponsive/   # 미응답 체크 Edge Function
├── public/
│   ├── sw.js                     # Service Worker
│   └── manifest.json             # PWA 매니페스트
└── README.md
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
cd hankkihanni
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# 푸시 알림 (선택)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# SMS - Aligo (한국)
ALIGO_API_KEY=your_aligo_key
ALIGO_USER_ID=your_user_id
ALIGO_SENDER=발신번호

# SMS - Twilio (해외)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Supabase 설정

1. [Supabase](https://supabase.com) 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. 알림 기능 사용 시 `supabase/schema-v2.sql` 실행
4. Authentication > Email Templates 에서 한글 템플릿 설정

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인!

## 📱 페이지 구조

| 경로 | 설명 |
|------|------|
| `/` | 메인 - 안부 확인, 캐릭터, 스트릭 |
| `/auth/login` | 로그인 |
| `/auth/signup` | 회원가입 (보호자 연락처 필수) |
| `/settings` | 설정 - 프로필, 보호자 정보 수정 |
| `/history` | 기록 - 월별 캘린더, 통계 |
| `/gallery` | 도감 - 캐릭터 컬렉션 |
| `/admin` | 관리자 - 미응답자 모니터링 |

## 🐣 캐릭터 진화 시스템

| 스트릭 | 캐릭터 | 설명 |
|--------|--------|------|
| 0~5일 | 🥚 알 | 시작! |
| 6~15일 | 🐣 아기 병아리 | 삐약삐약 |
| 16~30일 | 🐥 병아리 | 의젓해졌어요 |
| 31~60일 | 🐔 닭 | 꼬끼오! |
| 61~100일 | 🦃 칠면조 | 당당함의 상징 |
| 101일+ | 🦚 공작새 | 전설의 경지! |

## 🔔 알림 흐름

```
[매일 랜덤 시간] ─────► Supabase Cron Job
                            │
                            ▼
                    오전 11시~오후 2시 사이?
                            │
            ┌───────────────┴───────────────┐
            Yes                             No
            │                               │
            ▼                               ▼
      푸시 알림 전송                      대기
            │
            ▼
    사용자 앱 접속 & 응답
            │
   ┌────────┴────────┐
   │                 │
[먹었어]          [안먹었어]
   │                 │
   └────────┬────────┘
            │
            ▼
    DB 저장 + 스트릭 증가


[48시간 미응답 체크] ──► Supabase Cron Job
                            │
                            ▼
                    마지막 응답 48시간 경과?
                            │
            ┌───────────────┴───────────────┐
            Yes                             No
            │                               │
            ▼                               ▼
    보호자에게 SMS 발송                   대기
```

## 📜 라이선스

MIT License

---

Made with 💛 for your loved ones
