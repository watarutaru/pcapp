import { supabase } from './supabase';
import { PcNazo, PcNazoResult } from './types';

export async function getPcNazos(): Promise<PcNazo[]> {
  const { data, error } = await supabase
    .from('pc_nazo')
    .select('*')
    .order('date', { ascending: false });
  if (error) return [];
  return data;
}

export async function getPcNazo(id: string): Promise<PcNazo | null> {
  const { data, error } = await supabase
    .from('pc_nazo')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function getNazoResult(userId: string, nazoId: string): Promise<PcNazoResult | null> {
  const { data, error } = await supabase
    .from('pc_nazo_results')
    .select('*')
    .eq('user_id', userId)
    .eq('nazo_id', nazoId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function submitCorrectAnswer(userId: string, nazoId: string): Promise<void> {
  await supabase.from('pc_nazo_results').insert({
    user_id: userId,
    nazo_id: nazoId,
  });
}

export interface CreatePcNazoInput {
  title: string;
  date: string;
  body: string;
  image_url: string;
  correct_answers: string[];
  answer_display: string;
}

export async function createPcNazo(input: CreatePcNazoInput): Promise<void> {
  const { error } = await supabase.from('pc_nazo').insert({
    title: input.title,
    date: input.date,
    body: input.body,
    image_url: input.image_url,
    correct_answers: input.correct_answers,
    answer_display: input.answer_display,
  });
  if (error) throw error;
}

export async function updatePcNazo(id: string, input: Partial<CreatePcNazoInput & { image_url: string }>): Promise<void> {
  const { error } = await supabase.from('pc_nazo').update(input).eq('id', id);
  if (error) throw error;
}

export async function deletePcNazo(id: string): Promise<void> {
  const { error } = await supabase.from('pc_nazo').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadNazoImage(uri: string, mimeType?: string): Promise<string> {
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${Date.now()}.${ext}`;

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

export function normalizeAnswer(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, '');
}

export function checkAnswer(submitted: string, correctAnswers: string[]): boolean {
  const normalized = normalizeAnswer(submitted);
  return correctAnswers.some(a => normalizeAnswer(a) === normalized);
}
