import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Supabase 클라이언트 (환경 변수가 없으면 더미 클라이언트)
let supabase: SupabaseClient<Database>

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
} else {
  // 환경 변수가 없으면 더미 클라이언트 생성 (개발/데모 모드)
  console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다. 데모 모드로 실행됩니다.')
  
  // 더미 클라이언트 - 모든 호출에 빈 결과 반환
  supabase = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signUp: async () => ({ data: { user: null, session: null }, error: { message: '데모 모드입니다' } }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: '데모 모드입니다' } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          order: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
        }),
        gte: () => ({
          lte: () => ({
            order: async () => ({ data: [], error: null }),
          }),
          order: () => ({
            limit: async () => ({ data: [], error: null }),
          }),
        }),
        or: () => ({
          order: async () => ({ data: [], error: null }),
          not: () => ({
            order: async () => ({ data: [], error: null }),
          }),
        }),
        not: () => ({
          order: async () => ({ data: [], error: null }),
        }),
        order: () => ({
          limit: async () => ({ data: [], error: null }),
        }),
        limit: async () => ({ data: [], error: null }),
      }),
      insert: async () => ({ data: null, error: null }),
      update: () => ({
        eq: async () => ({ data: null, error: null }),
      }),
      delete: () => ({
        eq: async () => ({ data: null, error: null }),
      }),
    }),
  } as unknown as SupabaseClient<Database>
}

export { supabase }

// 서버 컴포넌트용 클라이언트 생성 함수
export function createServerSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabase // 더미 클라이언트 반환
  }
  
  return createClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}

// Supabase 연결 상태 확인
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}
