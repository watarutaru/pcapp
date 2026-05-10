export interface Profile {
  id: string;
  user_id: string;
  nickname: string;
  role: 'member' | 'admin';
  stage: string;
  total_points: number;
  visit_count: number;
  member_number?: string;
  created_at: string;
}

export type LiveCategory = 'ライブ' | '配信' | 'イベント' | 'グッズ';

export interface Live {
  id: string;
  title: string;
  date: string;
  venue: string;
  description: string;
  category: LiveCategory;
  open_time?: string;
  ticket_info?: string;
  artists?: string;
  set_list?: string;
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

export interface Mystery {
  id: string;
  vol: number;
  title: string;
  content: string;
  image_url?: string;
  hint?: string;
  answer?: string;
  is_published: boolean;
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
