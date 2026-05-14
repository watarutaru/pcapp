import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform, Switch,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getLives, createLive, updateLive, deleteLive } from '@/lib/lives';
import { sendPushNotificationToAll } from '@/lib/notifications';
import { Live, LiveCategory } from '@/lib/types';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { fonts } from '@/lib/fonts';

const CATEGORIES: LiveCategory[] = ['ライブ', '配信', 'イベント', 'グッズ'];

const INIT_FORM = {
  title: '',
  date: '',
  time: '',
  venue: '',
  category: 'ライブ' as LiveCategory,
  description: '',
};

const pad = (n: number) => String(n).padStart(2, '0');

function liveToForm(live: Live) {
  const d = new Date(live.date);
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const h = d.getHours(), m = d.getMinutes();
  const timeStr = (h === 0 && m === 0) ? '' : `${pad(h)}:${pad(m)}`;
  return {
    title: live.title,
    date: dateStr,
    time: timeStr,
    venue: live.venue,
    category: live.category,
    description: live.description,
  };
}

export default function AdminLiveScreen() {
  const router = useRouter();
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(INIT_FORM);
  const [sendNotif, setSendNotif] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLives(await getLives());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const titleSuggestions = useMemo(() => [...new Set(lives.map(l => l.title))], [lives]);
  const venueSuggestions = useMemo(() => [...new Set(lives.map(l => l.venue))], [lives]);

  function openNew() {
    setForm(INIT_FORM);
    setEditingId(null);
    setSendNotif(false);
    setError('');
    setMode('form');
  }

  function openEdit(live: Live) {
    setForm(liveToForm(live));
    setEditingId(live.id);
    setSendNotif(false);
    setError('');
    setMode('form');
  }

  async function handleSave() {
    setError('');
    if (!form.title.trim() || !form.date.trim() || !form.venue.trim()) {
      setError('タイトル・日付・会場は必須です');
      return;
    }
    const dateStr = form.time ? `${form.date}T${form.time}` : `${form.date}T00:00`;
    if (isNaN(new Date(dateStr).getTime())) {
      setError('日付の形式が正しくありません');
      return;
    }
    setSaving(true);
    try {
      const input = { ...form, date: dateStr };
      if (editingId) {
        await updateLive(editingId, input);
      } else {
        await createLive(input);
        if (sendNotif) {
          await sendPushNotificationToAll(
            'Piercing Cyclone',
            `「${form.title.trim()}」を追加しました 📅 ${form.date} ${form.venue.trim()}`,
          ).catch(() => {});
        }
      }
      setForm(INIT_FORM);
      setEditingId(null);
      setMode('list');
      await load();
    } catch (e: unknown) {
      const msg = (e as any)?.message || (e instanceof Error ? e.message : '') || '保存に失敗しました';
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(live: Live) {
    if (Platform.OS === 'web') {
      if (!window.confirm(`「${live.title}」を削除しますか？`)) return;
      try { await deleteLive(live.id); await load(); } catch { alert('削除に失敗しました'); }
    } else {
      Alert.alert('削除確認', `「${live.title}」を削除しますか？`, [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: async () => {
          try { await deleteLive(live.id); await load(); } catch { Alert.alert('エラー', '削除に失敗しました'); }
        }},
      ]);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (mode === 'form') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formScroll}>
        <Header
          title={editingId ? 'ライブ編集' : 'ライブ追加'}
          onBack={() => { setMode('list'); setError(''); setEditingId(null); }}
        />

        <View style={styles.formCard}>
          <Field label="タイトル *">
            <ComboBox
              value={form.title}
              onChangeText={v => setForm(f => ({ ...f, title: v }))}
              suggestions={titleSuggestions}
              placeholder="ライブ名"
            />
          </Field>

          <Field label="日付 *　/　時間（任意）">
            <View style={styles.dateTimeRow}>
              <DateInput
                value={form.date}
                onChange={v => setForm(f => ({ ...f, date: v }))}
                style={styles.dateInput}
              />
              <TimeInput
                value={form.time}
                onChange={v => setForm(f => ({ ...f, time: v }))}
                style={styles.timeInput}
              />
            </View>
          </Field>

          <Field label="会場 *">
            <ComboBox
              value={form.venue}
              onChangeText={v => setForm(f => ({ ...f, venue: v }))}
              suggestions={venueSuggestions}
              placeholder="会場名"
            />
          </Field>

          <Field label="カテゴリ">
            <View style={styles.categoryRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBtn, form.category === cat && styles.catBtnActive]}
                  onPress={() => setForm(f => ({ ...f, category: cat }))}
                >
                  <Text style={[styles.catBtnText, form.category === cat && styles.catBtnTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="詳細（任意）">
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={form.description}
              onChangeText={v => setForm(f => ({ ...f, description: v }))}
              placeholder="詳細テキスト"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </Field>

          {!editingId && (
            <View style={styles.notifRow}>
              <View style={styles.notifLabelGroup}>
                <Text style={styles.fieldLabel}>プッシュ通知を送信する</Text>
                {sendNotif && (
                  <Text style={styles.notifPreview}>
                    「{form.title.trim() || '(タイトル)'}」を追加しました 📅 {form.date} {form.venue.trim()}
                  </Text>
                )}
              </View>
              <Switch
                value={sendNotif}
                onValueChange={setSendNotif}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#fff"
              />
            </View>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.saveBtnWrapper}>
          <Button
            label={saving ? '保存中...' : editingId ? '更新する' : '保存する'}
            onPress={handleSave}
            disabled={saving}
            loading={saving}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="ライブ管理" onBack={() => router.back()} />

      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.list}>
          {lives.length === 0 && <Text style={styles.emptyText}>ライブがありません</Text>}
          {lives.map(live => (
            <View key={live.id} style={styles.row}>
              <TouchableOpacity style={styles.rowInfo} onPress={() => openEdit(live)}>
                <Text style={styles.rowTitle}>{live.title}</Text>
                <Text style={styles.rowSub}>
                  {new Date(live.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}　{live.venue}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(live)}>
                <Text style={styles.editBtnText}>編集</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(live)}>
                <Text style={styles.deleteBtnText}>削除</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <View style={styles.addWrapper}>
          <Button label="＋ ライブを追加" onPress={openNew} />
        </View>
      </View>
    </View>
  );
}

function DateInput({ value, onChange, style }: { value: string; onChange: (v: string) => void; style: object }) {
  return (
    <TextInput
      style={[styles.input, style]}
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD"
      placeholderTextColor={Colors.textSecondary}
      {...(Platform.OS === 'web' ? { type: 'date' } as any : {})}
    />
  );
}

function TimeInput({ value, onChange, style }: { value: string; onChange: (v: string) => void; style: object }) {
  return (
    <TextInput
      style={[styles.input, style]}
      value={value}
      onChangeText={onChange}
      placeholder="HH:MM（任意）"
      placeholderTextColor={Colors.textSecondary}
      {...(Platform.OS === 'web' ? { type: 'time' } as any : {})}
    />
  );
}

function ComboBox({ value, onChangeText, suggestions, placeholder }: {
  value: string;
  onChangeText: (v: string) => void;
  suggestions: string[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const filtered = suggestions
    .filter(s => !value || s.toLowerCase().includes(value.toLowerCase()))
    .filter(s => s.toLowerCase() !== value.toLowerCase())
    .slice(0, 5);

  return (
    <View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={v => { onChangeText(v); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
      />
      {open && filtered.length > 0 && (
        <View style={styles.suggestions}>
          {filtered.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.suggestionItem, i < filtered.length - 1 && styles.suggestionItemBorder]}
              onPress={() => { onChangeText(s); setOpen(false); }}
            >
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  rowInfo: { flex: 1 },
  rowTitle: { color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  rowSub: { color: Colors.textSecondary, fontSize: 12 },
  editBtn: { backgroundColor: Colors.primary + '22', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6 },
  editBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  deleteBtn: { backgroundColor: Colors.error + '22', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtnText: { color: Colors.error, fontSize: 13, fontWeight: '600' },
  addWrapper: { position: 'absolute', bottom: 24, left: 20, right: 20 },

  formScroll: { paddingBottom: 60 },
  formCard: {
    marginHorizontal: 20, backgroundColor: Colors.surface,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border,
  },
  field: { marginBottom: 18 },
  fieldLabel: {
    fontFamily: fonts.regular,
    color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.background, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12,
  },
  inputMulti: { height: 100, textAlignVertical: 'top' },
  dateTimeRow: { flexDirection: 'row', gap: 8 },
  dateInput: { flex: 3 } as any,
  timeInput: { flex: 2 } as any,
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catBtnText: { color: Colors.textSecondary, fontSize: 14 },
  catBtnTextActive: { color: '#fff', fontWeight: '700' },
  suggestions: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, marginTop: 4, overflow: 'hidden' },
  suggestionItem: { paddingHorizontal: 14, paddingVertical: 11 },
  suggestionItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  suggestionText: { color: Colors.text, fontSize: 15 },
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', paddingTop: 8,
  },
  notifLabelGroup: { flex: 1, marginRight: 12 },
  notifPreview: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginHorizontal: 20, marginTop: 12 },
  saveBtnWrapper: { marginHorizontal: 20, marginTop: 24 },
});
