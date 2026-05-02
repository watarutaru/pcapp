import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const key = (tab: string) => `last_viewed_${tab}`;

export async function markViewed(tab: string) {
  await AsyncStorage.setItem(key(tab), new Date().toISOString());
}

async function getLastViewed(tab: string): Promise<string | null> {
  return AsyncStorage.getItem(key(tab));
}

export async function checkLiveBadge(): Promise<boolean> {
  const last = await getLastViewed('live');
  if (!last) return false;
  const { data } = await supabase
    .from('lives')
    .select('id')
    .gt('created_at', last)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function checkDiaryBadge(): Promise<boolean> {
  const last = await getLastViewed('diary');
  if (!last) return false;
  const { data } = await supabase
    .from('diaries')
    .select('id')
    .gt('created_at', last)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function checkNazoBadge(): Promise<boolean> {
  const last = await getLastViewed('nazo');
  if (!last) return false;
  const { data } = await supabase
    .from('pc_nazo')
    .select('id')
    .gt('created_at', last)
    .limit(1);
  return (data?.length ?? 0) > 0;
}
