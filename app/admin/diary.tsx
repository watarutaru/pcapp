import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getDiaries, createDiary, deleteDiary } from '@/lib/diaries';
import { Diary } from '@/lib/types';
import { Colors } from '@/constants/colors';

const AUTHOR_CONFIG = {
  wataru: { label: 'WATARU', color: '#3182ce', emoji: '🎸' },
  tamaru: { label: 'TAMARU', color: '#e94560', emoji: '🥁' },
};

export default function AdminDiaryScreen() {
  const router = useRouter();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [author, setAuthor] = useState<'wataru' | 'tamaru'>('wataru');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setDiaries(await getDiaries());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleSave() {
    setError('');
    if (!content.trim()) {
      setError('本文を入力してください');
      return;
    }
    setSaving(true);
    try {
      await createDiary(author, content.trim());
      setContent('');
      setMode('list');
      await load();
    } catch (e: unknown) {
      const msg = (e as any)?.message || (e instanceof Error ? e.message : '') || '保存に失敗しました';
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(diary: Diary) {
    const config = AUTHOR_CONFIG[diary.author];
    const preview = diary.content.slice(0, 20) + (diary.content.length > 20 ? '...' : '');
    if (Platform.OS === 'web') {
      if (!window.confirm(`${config.label}の「${preview}」を削除しますか？`)) return;
      try {
        await deleteDiary(diary.id);
        await load();
      } catch {
        alert('削除に失敗しました');
      }
    } else {
      Alert.alert('削除確認', `${config.label}の「${preview}」を削除しますか？`, [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除', style: 'destructive', onPress: async () => {
            try {
              await deleteDiary(diary.id);
              await load();
            } catch {
              Alert.alert('エラー', '削除に失敗しました');
            }
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
          <Text style={styles.title}>日記追加</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>著者</Text>
            <View style={styles.authorRow}>
              {(['wataru', 'tamaru'] as const).map(a => {
                const cfg = AUTHOR_CONFIG[a];
                const active = author === a;
                return (
                  <TouchableOpacity
                    key={a}
                    style={[styles.authorBtn, active && { backgroundColor: cfg.color + '33', borderColor: cfg.color }]}
                    onPress={() => setAuthor(a)}
                  >
                    <Text style={styles.authorEmoji}>{cfg.emoji}</Text>
                    <Text style={[styles.authorLabel, active && { color: cfg.color }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>本文 *</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={content}
              onChangeText={setContent}
              placeholder="日記の内容を書いてください"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>
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
          <Text style={styles.title}>日記管理</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setMode('form')}>
            <Text style={styles.addBtnText}>＋ 追加</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {diaries.length === 0 && <Text style={styles.emptyText}>日記がありません</Text>}
        {diaries.map(diary => {
          const cfg = AUTHOR_CONFIG[diary.author];
          return (
            <View key={diary.id} style={styles.row}>
              <View style={[styles.authorDot, { backgroundColor: cfg.color }]} />
              <View style={styles.rowInfo}>
                <Text style={[styles.rowAuthor, { color: cfg.color }]}>{cfg.emoji} {cfg.label}</Text>
                <Text style={styles.rowPreview} numberOfLines={2}>{diary.content}</Text>
                <Text style={styles.rowDate}>
                  {new Date(diary.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(diary)}>
                <Text style={styles.deleteBtnText}>削除</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
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
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  authorDot: { width: 4, height: '100%', borderRadius: 2, marginRight: 12 },
  rowInfo: { flex: 1 },
  rowAuthor: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  rowPreview: { color: Colors.text, fontSize: 13, lineHeight: 18, marginBottom: 4 },
  rowDate: { color: Colors.textSecondary, fontSize: 11 },
  deleteBtn: { backgroundColor: Colors.error + '22', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 },
  deleteBtnText: { color: Colors.error, fontSize: 13, fontWeight: '600' },
  formScroll: { paddingBottom: 60 },
  formCard: {
    marginHorizontal: 24, backgroundColor: Colors.surface,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border,
  },
  field: { marginBottom: 18 },
  fieldLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  authorRow: { flexDirection: 'row', gap: 12 },
  authorBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingVertical: 12, gap: 8,
  },
  authorEmoji: { fontSize: 20 },
  authorLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.background, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  inputMulti: { height: 180, textAlignVertical: 'top' },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginHorizontal: 24, marginTop: 12 },
  saveBtn: {
    marginHorizontal: 24, marginTop: 24,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
