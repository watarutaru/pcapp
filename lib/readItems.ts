import { supabase } from './supabase';

export type ItemType = 'live' | 'diary' | 'mystery';

export async function markAsRead(userId: string, type: ItemType, itemId: string): Promise<void> {
  await supabase.from('read_items').upsert(
    { user_id: userId, item_type: type, item_id: itemId },
    { onConflict: 'user_id,item_type,item_id' }
  );
}

export async function getReadIds(userId: string, type: ItemType): Promise<Set<string>> {
  const { data } = await supabase
    .from('read_items')
    .select('item_id')
    .eq('user_id', userId)
    .eq('item_type', type);
  return new Set((data ?? []).map((r: { item_id: string }) => r.item_id));
}

export async function getItemIds(
  table: 'lives' | 'diaries' | 'mysteries',
  filter?: Record<string, unknown>
): Promise<string[]> {
  let query = supabase.from(table).select('id');
  if (filter) {
    for (const [col, val] of Object.entries(filter)) {
      query = query.eq(col, val);
    }
  }
  const { data } = await query;
  return (data ?? []).map((r: { id: string }) => r.id);
}
