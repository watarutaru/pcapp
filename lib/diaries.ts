import { supabase } from './supabase';
import { Diary } from './types';

export async function getDiaries(): Promise<Diary[]> {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

export async function getDiary(id: string): Promise<Diary | null> {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}
