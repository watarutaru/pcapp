import { supabase } from './supabase';
import { Mystery } from './types';

export async function uploadMysteryImage(uri: string, mimeType?: string): Promise<string> {
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `mystery_${Date.now()}.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('nazo-images')
    .upload(fileName, blob, {
      contentType: mimeType || 'image/jpeg',
      upsert: false,
    });
  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('nazo-images')
    .getPublicUrl(fileName);

  return publicUrl;
}

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

export async function uploadMysteryExplanationImage(uri: string, mimeType?: string): Promise<string> {
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `mystery_explanation_${Date.now()}.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('nazo-images')
    .upload(fileName, blob, {
      contentType: mimeType || 'image/jpeg',
      upsert: false,
    });
  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('nazo-images')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function createMystery(params: {
  vol: number;
  title: string;
  content: string;
  image_url?: string;
  explanation_image_url?: string;
  hint?: string;
  answer?: string;
  is_published: boolean;
}): Promise<void> {
  const { error } = await supabase.from('mysteries').insert(params);
  if (error) throw error;
}

export async function updateMystery(id: string, updates: Partial<Pick<Mystery, 'vol' | 'title' | 'content' | 'image_url' | 'explanation_image_url' | 'hint' | 'answer' | 'is_published'>>): Promise<void> {
  const { error } = await supabase.from('mysteries').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteMystery(id: string): Promise<void> {
  const { error } = await supabase.from('mysteries').delete().eq('id', id);
  if (error) throw error;
}
