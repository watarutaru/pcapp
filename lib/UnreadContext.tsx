import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';
import { markAsRead, getReadIds, getItemIds, ItemType } from './readItems';

type ReadIdsMap = Record<ItemType, Set<string>>;
type UnreadCountsMap = Record<ItemType, number>;

interface UnreadContextValue {
  readIds: ReadIdsMap;
  unreadCounts: UnreadCountsMap;
  markRead: (type: ItemType, itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const defaultReadIds: ReadIdsMap = { live: new Set(), diary: new Set(), mystery: new Set() };
const defaultCounts: UnreadCountsMap = { live: 0, diary: 0, mystery: 0 };

const UnreadContext = createContext<UnreadContextValue>({
  readIds: defaultReadIds,
  unreadCounts: defaultCounts,
  markRead: async () => {},
  refresh: async () => {},
});

export function UnreadProvider({ children }: { children: ReactNode }) {
  const [readIds, setReadIds] = useState<ReadIdsMap>(defaultReadIds);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCountsMap>(defaultCounts);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [liveReadIds, diaryReadIds, liveIds, diaryIds] = await Promise.all([
      getReadIds(user.id, 'live'),
      getReadIds(user.id, 'diary'),
      getItemIds('lives'),
      getItemIds('diaries'),
    ]);

    setReadIds({ live: liveReadIds, diary: diaryReadIds, mystery: new Set() });
    setUnreadCounts({
      live: liveIds.filter(id => !liveReadIds.has(id)).length,
      diary: diaryIds.filter(id => !diaryReadIds.has(id)).length,
      mystery: 0,
    });
  }, []);

  const markRead = useCallback(async (type: ItemType, itemId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await markAsRead(user.id, type, itemId);
    setReadIds(prev => {
      const updated = new Set(prev[type]);
      updated.add(itemId);
      return { ...prev, [type]: updated };
    });
    setUnreadCounts(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] - 1),
    }));
  }, []);

  useEffect(() => {
    refresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') refresh();
      if (event === 'SIGNED_OUT') {
        setReadIds(defaultReadIds);
        setUnreadCounts(defaultCounts);
      }
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  return (
    <UnreadContext.Provider value={{ readIds, unreadCounts, markRead, refresh }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnread() {
  return useContext(UnreadContext);
}
