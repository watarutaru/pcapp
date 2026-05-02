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
