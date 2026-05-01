import { supabase } from './supabase';
import { Live, Checkin } from './types';

export async function getLives(): Promise<Live[]> {
  const { data, error } = await supabase
    .from('lives')
    .select('*')
    .order('date', { ascending: false });
  if (error) return [];
  return data;
}

export async function getLive(id: string): Promise<Live | null> {
  const { data, error } = await supabase
    .from('lives')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function getUserCheckins(userId: string): Promise<Checkin[]> {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', userId);
  if (error) return [];
  return data;
}

/** 新規チェックインなら true、既にチェックイン済みなら false を返す */
export async function checkinToLive(userId: string, liveId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('checkins')
    .select('id')
    .eq('user_id', userId)
    .eq('live_id', liveId)
    .single();

  if (existing) return false;

  const { error } = await supabase.from('checkins').insert({
    user_id: userId,
    live_id: liveId,
  });
  if (error) throw error;
  return true;
}
