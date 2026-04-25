export interface Profile {
  id: string;
  user_id: string;
  nickname: string;
  stage: string;
  total_points: number;
  visit_count: number;
  created_at: string;
}

export interface Live {
  id: string;
  title: string;
  date: string;
  venue: string;
  description: string;
  created_at: string;
}

export interface Checkin {
  id: string;
  user_id: string;
  live_id: string;
  checked_in_at: string;
}

export interface Point {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface Diary {
  id: string;
  author: 'wataru' | 'tamaru';
  content: string;
  created_at: string;
}

export type Stage = 'ROOKIE' | 'FAN' | 'SUPPORTER' | 'CYCLONER' | 'LEGEND';

export const STAGE_THRESHOLDS: Record<Stage, number> = {
  ROOKIE: 0,
  FAN: 100,
  SUPPORTER: 300,
  CYCLONER: 700,
  LEGEND: 1500,
};

export function getStage(points: number): Stage {
  if (points >= 1500) return 'LEGEND';
  if (points >= 700) return 'CYCLONER';
  if (points >= 300) return 'SUPPORTER';
  if (points >= 100) return 'FAN';
  return 'ROOKIE';
}
