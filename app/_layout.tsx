import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { registerForPushNotifications, savePushToken } from '@/lib/notifications';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const token = await registerForPushNotifications();
        if (token) await savePushToken(session.user.id, token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      subscription.unsubscribe();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  if (!initialized) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
      </Stack>
    </>
  );
}
