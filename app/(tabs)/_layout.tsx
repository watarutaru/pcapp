import { useState, useEffect } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/profiles';
import { Colors } from '@/constants/colors';
import { checkLiveBadge, checkDiaryBadge, markViewed } from '@/lib/badges';

export default function TabsLayout() {
  const [liveBadge, setLiveBadge] = useState(false);
  const [diaryBadge, setDiaryBadge] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    Promise.all([checkLiveBadge(), checkDiaryBadge()]).then(([live, diary]) => {
      setLiveBadge(live);
      setDiaryBadge(diary);
    });

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const profile = await getProfile(user.id);
      setIsAdmin(profile?.role === 'admin');
    });
  }, []);

  useEffect(() => {
    if (pathname === '/live') {
      setLiveBadge(false);
      markViewed('live');
    } else if (pathname === '/diary') {
      setDiaryBadge(false);
      markViewed('diary');
    }
  }, [pathname]);

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
        options={{
          title: 'ライブ',
          tabBarLabel: 'ライブ',
          tabBarBadge: liveBadge ? '' : undefined,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: '交換日記',
          tabBarLabel: '日記',
          tabBarBadge: diaryBadge ? '' : undefined,
        }}
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
