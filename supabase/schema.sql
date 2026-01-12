-- 한끼했니 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- Users 테이블: 사용자 정보
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  guardian_phone VARCHAR(20), -- 보호자 연락처 (국제 형식)
  streak INTEGER DEFAULT 0,   -- 연속 방문 일수
  last_check_in TIMESTAMPTZ,  -- 마지막 안부 확인 시간
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check-ins 테이블: 안부 응답 기록
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  response VARCHAR(10) CHECK (response IN ('ate', 'not_ate')), -- 먹었어/안먹었어
  responded_at TIMESTAMPTZ,       -- 응답 시간
  scheduled_at TIMESTAMPTZ NOT NULL, -- 예정된 안부 확인 시간
  is_missed BOOLEAN DEFAULT FALSE,   -- 미응답 여부
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_scheduled_at ON check_ins(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회/수정 가능
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own check_ins" ON check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check_ins" ON check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check_ins" ON check_ins
  FOR UPDATE USING (auth.uid() = user_id);
