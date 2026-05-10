import { supabase } from './supabase';
import { Mystery } from './types';

export async function getMysteries(): Promise<Mystery[]> {
  const { data, error } = await supabase
    .from('mysteries')
    .select('*')
    .order('vol', { ascending: false });
  if (error) return [];
  return data;
}

export async function getMystery(id: string): Promise<Mystery | null> {
  const { data, error } = await supabase
    .from('mysteries')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function createMystery(params: {
  vol: number;
  title: string;
  content: string;
  image_url?: string;
  hint?: string;
  answer?: string;
  is_published: boolean;
}): Promise<void> {
  const { error } = await supabase.from('mysteries').insert(params);
  if (error) throw error;
}

export async function updateMystery(id: string, updates: Partial<Pick<Mystery, 'vol' | 'title' | 'content' | 'image_url' | 'hint' | 'answer' | 'is_published'>>): Promise<void> {
  const { error } = await supabase.from('mysteries').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteMystery(id: string): Promise<void> {
  const { error } = await supabase.from('mysteries').delete().eq('id', id);
  if (error) throw error;
}
