import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Platform, Switch,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getDiaries, createDiary, updateDiary, deleteDiary } from '@/lib/diaries';
import { sendPushNotificationToAll } from '@/lib/notifications';
import { Diary } from '@/lib/types';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { fonts } from '@/lib/fonts';

const AUTHOR_CONFIG = {
  wataru: { label: 'WATARU', color: '#3182ce', emoji: '🎸' },
  tamaru: { label: 'TAMARU', color: '#e94560', emoji: '🥁' },
};

export default function AdminDiaryScreen() {
  const router = useRouter();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [editingDiary, setEditingDiary] = useState<Diary | null>(null);
  const [author, setAuthor] = useState<'wataru' | 'tamaru'>('wataru');
  const [content, setContent] = useState('');
  const [sendNotif, setSendNotif] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setDiaries(await getDiaries());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function openNew() {
    setEditingDiary(null);
    setAuthor('wataru');
    setContent('');
    setSendNotif(false);
    setError('');
    setMode('form');
  }

  function openEdit(diary: Diary) {
    setEditingDiary(diary);
    setAuthor(diary.author);
    setContent(diary.content);
    setSendNotif(false);
    setError('');
    setMode('form');
  }

  async function handleSave() {
    setError('');
    if (!content.trim()) {
      setError('本文を入力してください');
      return;
    }
    setSaving(true);
    try {
      if (editingDiary) {
        await updateDiary(editingDiary.id, content.trim());
      } else {
        await createDiary(author, content.trim());
        if (sendNotif) {
          const cfg = AUTHOR_CONFIG[author];
          const preview = content.trim().slice(0, 30);
          await sendPushNotificationToAll(
            '交換日記',
            `${cfg.label}から日記が届きました ✉️ ${preview}${content.trim().length > 30 ? '…' : ''}`,
          ).catch(() => {});
        }
      }
      setContent('');
      setEditingDiary(null);
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
      try { await deleteDiary(diary.id); await load(); } catch { alert('削除に失敗しました'); }
    } else {
      Alert.alert('削除確認', `${config.label}の「${preview}」を削除しますか？`, [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除', style: 'destructive', onPress: async () => {
            try { await deleteDiary(diary.id); await load(); }
            catch { Alert.alert('エラー', '削除に失敗しました'); }
          },
        },
      ]);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (mode === 'form') {
    const isEditing = editingDiary !== null;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formScroll}>
        <Header
          title={isEditing ? '日記編集' : '日記追加'}
          onBack={() => { setMode('list'); setEditingDiary(null); setError(''); }}
        />

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
                    style={[
                      styles.authorBtn,
                      active && { backgroundColor: cfg.color + '33', borderColor: cfg.color },
                      isEditing && styles.authorBtnDisabled,
                    ]}
                    onPress={() => !isEditing && setAuthor(a)}
                    disabled={isEditing}
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

          {!isEditing && (
            <View style={styles.notifRow}>
              <View style={styles.notifLabelGroup}>
                <Text style={styles.fieldLabel}>プッシュ通知を送信する</Text>
                {sendNotif && (
                  <Text style={styles.notifPreview}>
                    {AUTHOR_CONFIG[author].label}から日記が届きました ✉️ {content.trim().slice(0, 30)}{content.trim().length > 30 ? '…' : ''}
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
            label={saving ? '保存中...' : isEditing ? '更新する' : '保存する'}
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
      <Header title="日記管理" onBack={() => router.back()} />

      <View style={styles.flex}>
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
                    {new Date(diary.created_at).toLocaleDateString('ja-JP', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </Text>
                </View>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(diary)}>
                  <Text style={styles.editBtnText}>編集</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(diary)}>
                  <Text style={styles.deleteBtnText}>削除</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.addWrapper}>
          <Button label="＋ 日記を追加" onPress={openNew} />
        </View>
      </View>
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
  authorDot: { width: 4, height: '100%', borderRadius: 2, marginRight: 12 },
  rowInfo: { flex: 1 },
  rowAuthor: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  rowPreview: { color: Colors.text, fontSize: 13, lineHeight: 18, marginBottom: 4 },
  rowDate: { color: Colors.textSecondary, fontSize: 11 },
  editBtn: {
    backgroundColor: Colors.primary + '22', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, marginRight: 6,
  },
  editBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  deleteBtn: {
    backgroundColor: Colors.error + '22', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  deleteBtnText: { color: Colors.error, fontSize: 13, fontWeight: '600' },

  addWrapper: { position: 'absolute', bottom: 24, left: 20, right: 20 },

  formScroll: { paddingBottom: 60 },
  formCard: {
    marginHorizontal: 20, backgroundColor: Colors.surface,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border,
  },
  field: { marginBottom: 18 },
  fieldLabel: {
    fontFamily: fonts.jpRegular,
    color: Colors.textSecondary, fontSize: 12, marginBottom: 8, letterSpacing: 0.5,
  },
  authorRow: { flexDirection: 'row', gap: 12 },
  authorBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingVertical: 12, gap: 8,
  },
  authorBtnDisabled: { opacity: 0.5 },
  authorEmoji: { fontSize: 20 },
  authorLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.background, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  inputMulti: { height: 180, textAlignVertical: 'top' },
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', paddingTop: 8,
  },
  notifLabelGroup: { flex: 1, marginRight: 12 },
  notifPreview: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginHorizontal: 20, marginTop: 12 },
  saveBtnWrapper: { marginHorizontal: 20, marginTop: 24 },
});
