-- 한끼했니 데이터베이스 스키마 v2
-- 푸시 알림, 긴급 알림 기능 추가

-- 기존 테이블에 푸시 구독 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_subscription TEXT;

-- 알림 로그 테이블
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'reminder', 'emergency', 'welcome'
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 긴급 알림 테이블 (48시간 미응답 시)
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  guardian_phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 푸시 구독 테이블 (별도 관리 옵션)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- 스케줄된 알림 테이블 (랜덤 시간 알림용)
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  notification_type VARCHAR(50) DEFAULT 'reminder',
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user ON emergency_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_sent ON emergency_alerts(sent_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_time ON scheduled_notifications(scheduled_for);

-- RLS 정책
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림 로그만 조회 가능
CREATE POLICY "Users can view own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 긴급 알림은 관리자만 조회 가능 (서비스 역할 키 사용)
CREATE POLICY "Service role can manage emergency alerts" ON emergency_alerts
  FOR ALL USING (true);

-- 푸시 구독 관리
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 스케줄된 알림
CREATE POLICY "Users can view own scheduled notifications" ON scheduled_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- 매일 랜덤 시간 알림 생성 함수
CREATE OR REPLACE FUNCTION create_daily_random_notification(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  random_hour INTEGER;
  random_minute INTEGER;
  scheduled_time TIMESTAMPTZ;
BEGIN
  -- 오전 11시 ~ 오후 1시 59분 사이 랜덤 시간
  random_hour := 11 + floor(random() * 3)::INTEGER; -- 11, 12, 13
  random_minute := floor(random() * 60)::INTEGER;
  
  -- 오늘 날짜에 랜덤 시간 적용
  scheduled_time := DATE_TRUNC('day', NOW()) + 
                    (random_hour || ' hours')::INTERVAL + 
                    (random_minute || ' minutes')::INTERVAL;
  
  -- 이미 지난 시간이면 내일로 설정
  IF scheduled_time < NOW() THEN
    scheduled_time := scheduled_time + INTERVAL '1 day';
  END IF;
  
  -- 스케줄 생성 (중복 방지)
  INSERT INTO scheduled_notifications (user_id, scheduled_for, notification_type)
  VALUES (target_user_id, scheduled_time, 'reminder')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 모든 사용자에게 일일 알림 스케줄 생성
CREATE OR REPLACE FUNCTION schedule_daily_notifications()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM users WHERE push_subscription IS NOT NULL
  LOOP
    PERFORM create_daily_random_notification(user_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
