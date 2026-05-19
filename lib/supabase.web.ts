import { createClient } from '@supabase/supabase-js';

// Web ではブラウザ本来の URL API を使うため react-native-url-polyfill は不要
// polyfill を import すると Supabase の初期化が ~1.6s 遅延するため除外している
// カスタムアダプターは使わず Supabase デフォルトの localStorage を使う
// （カスタムアダプターは内部ロック機構と干渉し INITIAL_SESSION が遅延する）

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
