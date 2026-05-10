import { Platform } from 'react-native';
import { supabase } from './supabase';

const REDIRECT_URL = Platform.OS === 'web'
  ? 'https://pcapp-preview.netlify.app'
  : 'pcapp://';

export async function sendMagicLink(email: string, nickname?: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: REDIRECT_URL,
      ...(nickname && { data: { nickname } }),
    },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}
