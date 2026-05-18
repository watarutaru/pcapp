import { useEffect, useState, useRef } from 'react';
import { Platform, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { registerForPushNotifications, savePushToken } from '@/lib/notifications';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { UnreadProvider } from '@/lib/UnreadContext';
import {
  useFonts,
  Lato_300Light,
  Lato_400Regular,
  Lato_700Bold,
  Lato_900Black,
} from '@expo-google-fonts/lato';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();
  const [fontsLoaded, fontError] = useFonts({ Lato_300Light, Lato_400Regular, Lato_700Bold, Lato_900Black });
  // web: CSSで既にロード済み。native: ロード完了かエラーで続行
  const isFontReady = Platform.OS === 'web' || fontsLoaded || !!fontError;

  async function handleAuthUrl(url: string) {
    const fragment = url.split('#')[1];
    if (!fragment) return;
    const params = new URLSearchParams(fragment);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const type = params.get('type');
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
      if (type === 'recovery') {
        router.replace('/(auth)/reset-password');
      }
    }
  }

  useEffect(() => {
    async function initialize() {
      const url = await Linking.getInitialURL();
      if (url) await handleAuthUrl(url);
    }

    initialize();

    const linkingSub = Linking.addEventListener('url', ({ url }) => handleAuthUrl(url));

    // Supabase が応答しない場合のフォールバック（5秒後に強制初期化）
    initTimeoutRef.current = setTimeout(() => setInitialized(true), 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (event === 'INITIAL_SESSION') {
        clearTimeout(initTimeoutRef.current);
        setInitialized(true);
      }

      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/(auth)/reset-password');
        return;
      }

      if (session?.user) {
        try {
          const token = await registerForPushNotifications();
          if (token) await savePushToken(session.user.id, token);
        } catch {
          // push token 保存失敗はアプリ動作に影響しない
        }

        if (event === 'SIGNED_IN') {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!existing) {
            const nickname = session.user.user_metadata?.nickname
              || session.user.email?.split('@')[0]
              || 'ファン';
            await supabase.from('profiles').insert({
              user_id: session.user.id,
              nickname,
              stage: 'ROOKIE',
              total_points: 0,
              visit_count: 0,
            });
          }
        }
      }
    });

    if (Platform.OS !== 'web') {
      notificationListener.current = Notifications.addNotificationReceivedListener(() => {});
      responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {});
    }

    return () => {
      clearTimeout(initTimeoutRef.current);
      linkingSub.remove();
      subscription.unsubscribe();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const inAuth = segments[0] === '(auth)';
    const inReset = inAuth && segments[1] === 'reset-password';
    if (inReset) return; // パスワードリセット中は自動遷移をスキップ
    const inComponentLibrary = segments[0] === 'component-library';
    if (!session && !inAuth && !inComponentLibrary) {
      router.replace('/(auth)/login');
    } else if (session && inAuth) {
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments]);

  if (!initialized || !isFontReady) return <View style={{ flex: 1, backgroundColor: '#1a1a2e' }} />;

  return (
    <>
      <StatusBar style="dark" />
      <UnreadProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {session ? (
            <Stack.Screen name="(tabs)" />
          ) : (
            <Stack.Screen name="(auth)" />
          )}
        </Stack>
      </UnreadProvider>
    </>
  );
}
