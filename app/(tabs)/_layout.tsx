import { Tabs } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useUnread } from '@/lib/UnreadContext';
import IcHome from '@/components/icons/IcHome';
import IcLive from '@/components/icons/IcLive';
import IcDiary from '@/components/icons/IcDiary';
import IcNazo from '@/components/icons/IcNazo';
import IcMusic from '@/components/icons/IcMusic';

export default function TabsLayout() {
  const { unreadCounts } = useUnread();
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
        options={{
          title: 'ホーム',
          tabBarLabel: 'ホーム',
          tabBarIcon: ({ focused }) => (
            <IcHome size={28} variant={focused ? 'color' : 'regular'} color='#898989' />
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'ライブ',
          tabBarLabel: 'ライブ',
          tabBarBadge: unreadCounts.live > 0 ? unreadCounts.live : undefined,
          tabBarIcon: ({ focused }) => (
            <IcLive size={28} variant={focused ? 'color' : 'regular'} color='#898989' />
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: '交換日記',
          tabBarLabel: '日記',
          tabBarBadge: unreadCounts.diary > 0 ? unreadCounts.diary : undefined,
          tabBarIcon: ({ focused }) => (
            <IcDiary size={28} variant={focused ? 'color' : 'regular'} color='#898989' />
          ),
        }}
      />
      <Tabs.Screen
        name="nazo"
        options={{
          title: 'ナゾ',
          tabBarLabel: 'ナゾ',
          tabBarBadge: unreadCounts.mystery > 0 ? unreadCounts.mystery : undefined,
          tabBarIcon: ({ focused }) => (
            <IcNazo size={28} variant={focused ? 'color' : 'regular'} color='#898989' />
          ),
        }}
      />
      <Tabs.Screen
        name="music"
        options={{
          title: '音楽',
          tabBarLabel: '音楽',
          tabBarIcon: ({ focused }) => (
            <IcMusic size={28} variant={focused ? 'color' : 'regular'} color='#898989' />
          ),
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{ title: 'マイページ', href: null }}
      />
      <Tabs.Screen
        name="admin"
        options={{ title: '管理', href: null }}
      />
    </Tabs>
  );
}
