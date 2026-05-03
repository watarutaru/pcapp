import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getLives, createLive, deleteLive } from '@/lib/lives';
import { Live, LiveCategory } from '@/lib/types';
import { Colors } from '@/constants/colors';

const CATEGORIES: LiveCategory[] = ['ライブ', '配信', 'イベント', 'グッズ'];

const INIT_FORM = {
  title: '',
  date: '',
  time: '',
  venue: '',
  category: 'ライブ' as LiveCategory,
  description: '',
};

export default function AdminLiveScreen() {
  const router = useRouter();
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [form, setForm] = useState(INIT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLives(await getLives());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const titleSuggestions = useMemo(() => [...new Set(lives.map(l => l.title))], [lives]);
  const venueSuggestions = useMemo(() => [...new Set(lives.map(l => l.venue))], [lives]);

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
      await createLive({ ...form, date: dateStr });
      setForm(INIT_FORM);
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
      try {
        await deleteLive(live.id);
        await load();
      } catch {
        alert('削除に失敗しました');
      }
    } else {
      Alert.alert('削除確認', `「${live.title}」を削除しますか？`, [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除', style: 'destructive', onPress: async () => {
            try { await deleteLive(live.id); await load(); } catch { Alert.alert('エラー', '削除に失敗しました'); }
          },
        },
      ]);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (mode === 'form') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formScroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setMode('list'); setError(''); }} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>ライブ追加</Text>
        </View>

        <View style={styles.formCard}>
          <Field label="タイトル *">
            <ComboBox
              value={form.title}
              onChangeText={v => setForm(f => ({ ...f, title: v }))}
              suggestions={titleSuggestions}
              placeholder="ライブ名"
              style={styles.input}
            />
          </Field>

          <Field label="日付 *　/　時間（任意）">
            <View style={styles.dateTimeRow}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                value={form.date}
                onChangeText={v => setForm(f => ({ ...f, date: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textSecondary}
                {...(Platform.OS === 'web' ? { type: 'date' } as any : {})}
              />
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={form.time}
                onChangeText={v => setForm(f => ({ ...f, time: v }))}
                placeholder="HH:MM"
                placeholderTextColor={Colors.textSecondary}
                {...(Platform.OS === 'web' ? { type: 'time' } as any : {})}
              />
            </View>
          </Field>

          <Field label="会場 *">
            <ComboBox
              value={form.venue}
              onChangeText={v => setForm(f => ({ ...f, venue: v }))}
              suggestions={venueSuggestions}
              placeholder="会場名"
              style={styles.input}
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
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? '保存中...' : '保存する'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 戻る</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.title}>ライブ管理</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setMode('form')}>
            <Text style={styles.addBtnText}>＋ 追加</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {lives.length === 0 && <Text style={styles.emptyText}>ライブがありません</Text>}
        {lives.map(live => (
          <View key={live.id} style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>{live.title}</Text>
              <Text style={styles.rowSub}>
                {new Date(live.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}　{live.venue}
              </Text>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(live)}>
              <Text style={styles.deleteBtnText}>削除</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function ComboBox({ value, onChangeText, suggestions, placeholder, style }: {
  value: string;
  onChangeText: (v: string) => void;
  suggestions: string[];
  placeholder: string;
  style: object;
}) {
  const [open, setOpen] = useState(false);
  const filtered = suggestions
    .filter(s => !value || s.toLowerCase().includes(value.toLowerCase()))
    .filter(s => s.toLowerCase() !== value.toLowerCase())
    .slice(0, 5);

  return (
    <View>
      <TextInput
        style={style}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { marginBottom: 8 },
  backBtnText: { color: Colors.primary, fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  rowInfo: { flex: 1 },
  rowTitle: { color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  rowSub: { color: Colors.textSecondary, fontSize: 12 },
  deleteBtn: { backgroundColor: Colors.error + '22', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtnText: { color: Colors.error, fontSize: 13, fontWeight: '600' },
  formScroll: { paddingBottom: 60 },
  formCard: {
    marginHorizontal: 24, backgroundColor: Colors.surface,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border,
  },
  field: { marginBottom: 18 },
  fieldLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.background, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  inputMulti: { height: 100, textAlignVertical: 'top' },
  dateTimeRow: { flexDirection: 'row', gap: 8 },
  dateInput: { flex: 3 },
  timeInput: { flex: 2 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catBtnText: { color: Colors.textSecondary, fontSize: 14 },
  catBtnTextActive: { color: '#fff', fontWeight: '700' },
  suggestions: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, marginTop: 4, overflow: 'hidden',
  },
  suggestionItem: { paddingHorizontal: 14, paddingVertical: 11 },
  suggestionItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  suggestionText: { color: Colors.text, fontSize: 15 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginHorizontal: 24, marginTop: 12 },
  saveBtn: {
    marginHorizontal: 24, marginTop: 24,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
