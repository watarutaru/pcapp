import { supabase } from './supabase';
import { Music } from './types';

export async function getMusic(): Promise<Music[]> {
  const { data, error } = await supabase
    .from('music')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return [];
  return data;
}

export interface MusicInput {
  title: string;
  type: string;
  jacket_url: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  youtube_music_url: string | null;
  line_music_url: string | null;
  sort_order: number;
}

export async function createMusic(input: MusicInput): Promise<void> {
  const { error } = await supabase.from('music').insert(input);
  if (error) throw error;
}

export async function updateMusic(id: string, input: Partial<MusicInput>): Promise<void> {
  const { error } = await supabase.from('music').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteMusic(id: string): Promise<void> {
  const { error } = await supabase.from('music').delete().eq('id', id);
  if (error) throw error;
}

function getImageExt(uri: string, mimeType?: string): string {
  const mimeExt = mimeType?.split('/')[1]?.replace('jpeg', 'jpg');
  if (mimeExt && mimeExt.length <= 4) return mimeExt;
  const uriExt = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (uriExt && uriExt.length <= 4 && !uriExt.includes('/') && !uriExt.includes(':')) return uriExt;
  return 'jpg';
}

export async function uploadMusicJacket(uri: string, mimeType?: string): Promise<string> {
  const ext = getImageExt(uri, mimeType);
  const fileName = `${Date.now()}.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('music-jackets')
    .upload(fileName, blob, {
      contentType: mimeType || 'image/jpeg',
      upsert: false,
    });
  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('music-jackets')
    .getPublicUrl(fileName);

  return publicUrl;
}
