import { supabase } from './supabase';
import { Profile, getStage } from './types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function getOrCreateProfile(userId: string, email: string): Promise<Profile | null> {
  const existing = await getProfile(userId);
  if (existing) return existing;

  const nickname = email.split('@')[0];
  const { data, error } = await supabase
    .from('profiles')
    .insert({ user_id: userId, nickname, role: 'member', stage: 'ROOKIE', total_points: 0, visit_count: 0 })
    .select()
    .single();
  if (error) return null;
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Pick<Profile, 'nickname'>>) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function addPoints(userId: string, amount: number, reason: string) {
  const { error: pointError } = await supabase.from('points').insert({
    user_id: userId,
    amount,
    reason,
  });
  if (pointError) throw pointError;

  const profile = await getProfile(userId);
  if (!profile) throw new Error('Profile not found');

  const newTotal = profile.total_points + amount;
  const newStage = getStage(newTotal);

  const { error } = await supabase
    .from('profiles')
    .update({ total_points: newTotal, stage: newStage })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function getPointHistory(userId: string) {
  const { data, error } = await supabase
    .from('points')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return [];
  return data;
}
