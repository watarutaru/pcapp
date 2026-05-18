import { Tabs } from 'expo-router';
import { useUnread } from '@/lib/UnreadContext';
import BottomNav, { NavTab } from '@/components/layout/BottomNav';

const ROUTE_TO_TAB: Record<string, NavTab> = {
  index: 'home',
  live: 'live',
  diary: 'diary',
  nazo: 'nazo',
  music: 'music',
};

const TAB_TO_ROUTE: Record<NavTab, string> = {
  home: 'index',
  live: 'live',
  diary: 'diary',
  nazo: 'nazo',
  music: 'music',
};

export default function TabsLayout() {
  const { unreadCounts } = useUnread();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => {
        const routeName = props.state.routes[props.state.index]?.name ?? 'index';
        if (routeName === 'mypage' || routeName === 'admin') return null;
        const activeTab = ROUTE_TO_TAB[routeName];
        return (
          <BottomNav
            activeTab={activeTab}
            onTabPress={(tab) => props.navigation.navigate(TAB_TO_ROUTE[tab])}
            badges={{
              live: unreadCounts.live,
              diary: unreadCounts.diary,
              nazo: unreadCounts.mystery,
            }}
          />
        );
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'ホーム' }} />
      <Tabs.Screen name="live" options={{ title: 'ライブ' }} />
      <Tabs.Screen name="diary" options={{ title: '交換日記' }} />
      <Tabs.Screen name="nazo" options={{ title: 'ナゾ' }} />
      <Tabs.Screen name="music" options={{ title: '音楽' }} />
      <Tabs.Screen name="mypage" options={{ title: 'マイページ', href: null }} />
      <Tabs.Screen name="admin" options={{ title: '管理', href: null }} />
    </Tabs>
  );
}
