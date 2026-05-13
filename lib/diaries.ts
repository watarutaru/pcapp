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

export async function createDiary(author: 'wataru' | 'tamaru', content: string): Promise<void> {
  const { error } = await supabase.from('diaries').insert({ author, content });
  if (error) throw error;
}

export async function updateDiary(id: string, content: string): Promise<void> {
  const { error } = await supabase.from('diaries').update({ content }).eq('id', id);
  if (error) throw error;
}

export async function deleteDiary(id: string): Promise<void> {
  const { error } = await supabase.from('diaries').delete().eq('id', id);
  if (error) throw error;
}

