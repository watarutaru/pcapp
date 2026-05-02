import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { registerForPushNotifications, savePushToken } from '@/lib/notifications';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';

async function handleAuthUrl(url: string) {
  const fragment = url.split('#')[1];
  if (!fragment) return;
  const params = new URLSearchParams(fragment);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
  }
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    async function initialize() {
      try {
        // Web では detectSessionInUrl: true が自動でトークンを処理するため不要
        if (Platform.OS !== 'web') {
          const url = await Linking.getInitialURL();
          if (url) await handleAuthUrl(url);
        }
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } finally {
        setInitialized(true);
      }
    }

    initialize();

    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      if (Platform.OS !== 'web') handleAuthUrl(url);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
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

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      linkingSub.remove();
      subscription.unsubscribe();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (session && inAuthGroup) {
      router.replace('/(tabs)' as any);
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/login' as any);
    }
  }, [session, initialized, segments]);

  if (!initialized) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </>
  );
}

