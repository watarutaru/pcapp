import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getLives, createLive, deleteLive } from '@/lib/lives';
import { Live, LiveCategory } from '@/lib/types';
import { Colors } from '@/constants/colors';

const CATEGORIES: LiveCategory[] = ['ライブ', '配信', 'イベント', 'グッズ'];

const INIT_FORM = { title: '', date: '', venue: '', category: 'ライブ' as LiveCategory, description: '' };

export default function AdminLiveScreen() {
  const router = useRouter();
  const [lives, setLives] = useState<Live[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [form, setForm] = useState(INIT_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLives(await getLives());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleSave() {
    if (!form.title.trim() || !form.date.trim() || !form.venue.trim()) {
      Alert.alert('入力エラー', 'タイトル・日時・会場は必須です');
      return;
    }
    if (isNaN(new Date(form.date).getTime())) {
      Alert.alert('入力エラー', '日時の形式が正しくありません\n例: 2026-05-01 18:00');
      return;
    }
    setSaving(true);
    try {
      await createLive(form);
      setForm(INIT_FORM);
      setMode('list');
      await load();
    } catch (e) {
      Alert.alert('エラー', e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(live: Live) {
    Alert.alert('削除確認', `「${live.title}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive', onPress: async () => {
          try {
            await deleteLive(live.id);
            await load();
          } catch (e) {
            Alert.alert('エラー', '削除に失敗しました');
          }
        },
      },
    ]);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (mode === 'form') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formScroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMode('list')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>ライブ追加</Text>
        </View>

        <View style={styles.formCard}>
          <Field label="タイトル *">
            <TextInput style={styles.input} value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="ライブ名" placeholderTextColor={Colors.textSecondary} />
          </Field>
          <Field label="日時 * （例: 2026-05-01 18:00）">
            <TextInput style={styles.input} value={form.date} onChangeText={v => setForm(f => ({ ...f, date: v }))} placeholder="YYYY-MM-DD HH:mm" placeholderTextColor={Colors.textSecondary} />
          </Field>
          <Field label="会場 *">
            <TextInput style={styles.input} value={form.venue} onChangeText={v => setForm(f => ({ ...f, venue: v }))} placeholder="会場名" placeholderTextColor={Colors.textSecondary} />
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
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  catBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catBtnText: { color: Colors.textSecondary, fontSize: 14 },
  catBtnTextActive: { color: '#fff', fontWeight: '700' },
  saveBtn: {
    marginHorizontal: 24, marginTop: 24,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
