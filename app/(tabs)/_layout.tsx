import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/profiles';
import { Colors } from '@/constants/colors';

export default function TabsLayout() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const profile = await getProfile(user.id);
      setIsAdmin(profile?.role === 'admin');
    });
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'ホーム', tabBarLabel: 'ホーム' }}
      />
      <Tabs.Screen
        name="live"
        options={{ title: 'ライブ', tabBarLabel: 'ライブ' }}
      />
      <Tabs.Screen
        name="diary"
        options={{ title: '交換日記', tabBarLabel: '日記' }}
      />
      <Tabs.Screen
        name="music"
        options={{ title: '音楽', tabBarLabel: '音楽' }}
      />
      <Tabs.Screen
        name="mypage"
        options={{ title: 'マイページ', tabBarLabel: 'マイページ' }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: '管理',
          tabBarLabel: '管理',
          href: isAdmin ? undefined : null,
        }}
      />
    </Tabs>
  );
}
