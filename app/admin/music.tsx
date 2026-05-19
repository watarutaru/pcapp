import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getMusic, createMusic, updateMusic, deleteMusic, uploadMusicJacket } from '@/lib/music';
import { Music } from '@/lib/types';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import ImagePickerField from '@/components/form/ImagePickerField';
import { Colors } from '@/constants/colors';
import { fonts } from '@/lib/fonts';

const TYPES = ['アルバム', 'シングル', 'EP'] as const;
type MusicType = typeof TYPES[number];

const INIT_FORM = {
  title: '',
  type: 'アルバム' as MusicType,
  spotify_url: '',
  apple_music_url: '',
  youtube_music_url: '',
  line_music_url: '',
  sort_order: '',
};

const PLATFORMS = [
  { key: 'spotify_url', label: 'Spotify' },
  { key: 'apple_music_url', label: 'Apple Music' },
  { key: 'youtube_music_url', label: 'YouTube Music' },
  { key: 'line_music_url', label: 'LINE MUSIC' },
] as const;

export default function AdminMusicScreen() {
  const router = useRouter();
  const [musics, setMusics] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [editingMusic, setEditingMusic] = useState<Music | null>(null);
  const [form, setForm] = useState(INIT_FORM);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setMusics(await getMusic());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function openNew() {
    setEditingMusic(null);
    setForm(INIT_FORM);
    setImageUri(null);
    setImageMime(undefined);
    setError('');
    setMode('form');
  }

  function openEdit(music: Music) {
    setEditingMusic(music);
    setForm({
      title: music.title,
      type: (TYPES.includes(music.type as MusicType) ? music.type : 'アルバム') as MusicType,
      spotify_url: music.spotify_url ?? '',
      apple_music_url: music.apple_music_url ?? '',
      youtube_music_url: music.youtube_music_url ?? '',
      line_music_url: music.line_music_url ?? '',
      sort_order: String(music.sort_order),
    });
    setImageUri(music.jacket_url);
    setImageMime(undefined);
    setError('');
    setMode('form');
  }

  async function handleSave() {
    setError('');
    if (!form.title.trim()) {
      setError('タイトルを入力してください');
      return;
    }
    const sortOrderNum = parseInt(form.sort_order, 10);
    if (!form.sort_order || isNaN(sortOrderNum)) {
      setError('表示順を数字で入力してください');
      return;
    }

    setSaving(true);
    try {
      let jacketUrl: string | null = imageUri;
      const isNewImage = editingMusic
        ? imageUri !== editingMusic.jacket_url
        : imageUri !== null;
      if (isNewImage && imageUri) {
        jacketUrl = await uploadMusicJacket(imageUri, imageMime);
      }

      const payload = {
        title: form.title.trim(),
        type: form.type,
        jacket_url: jacketUrl,
        spotify_url: form.spotify_url.trim() || null,
        apple_music_url: form.apple_music_url.trim() || null,
        youtube_music_url: form.youtube_music_url.trim() || null,
        line_music_url: form.line_music_url.trim() || null,
        sort_order: sortOrderNum,
      };

      if (editingMusic) {
        await updateMusic(editingMusic.id, payload);
      } else {
        await createMusic(payload);
      }
      setForm(INIT_FORM);
      setImageUri(null);
      setEditingMusic(null);
      setMode('list');
      await load();
    } catch (e: unknown) {
      const msg = (e as any)?.message || (e instanceof Error ? e.message : '') || '保存に失敗しました';
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(music: Music) {
    if (Platform.OS === 'web') {
      if (!window.confirm(`「${music.title}」を削除しますか？`)) return;
      try { await deleteMusic(music.id); await load(); } catch { alert('削除に失敗しました'); }
    } else {
      Alert.alert('削除確認', `「${music.title}」を削除しますか？`, [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除', style: 'destructive', onPress: async () => {
            try { await deleteMusic(music.id); await load(); }
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
    const isEditing = editingMusic !== null;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formScroll}>
        <Header
          title={isEditing ? 'Music編集' : 'Music追加'}
          onBack={() => { setMode('list'); setEditingMusic(null); setImageUri(null); setForm(INIT_FORM); setError(''); }}
        />

        <View style={styles.formCard}>
          <Field label="タイトル *">
            <TextInput
              style={styles.input} value={form.title}
              onChangeText={v => setForm(f => ({ ...f, title: v }))}
              placeholder="例: Q" placeholderTextColor={Colors.textSecondary}
            />
          </Field>

          <Field label="種別 *">
            <View style={styles.typeRow}>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, form.type === t && styles.typeBtnActive]}
                  onPress={() => setForm(f => ({ ...f, type: t }))}
                >
                  <Text style={[styles.typeBtnText, form.type === t && styles.typeBtnTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="ジャケット画像">
            <ImagePickerField
              uri={imageUri}
              onImageSelected={(uri, mime) => { setImageUri(uri); setImageMime(mime); }}
              placeholder="📷 画像を選択"
              resizeMode="cover"
            />
          </Field>

          <Field label="表示順 * （小さいほど上に表示）">
            <TextInput
              style={styles.input} value={form.sort_order}
              onChangeText={v => setForm(f => ({ ...f, sort_order: v }))}
              placeholder="1" placeholderTextColor={Colors.textSecondary}
              keyboardType="number-pad"
            />
          </Field>

          {PLATFORMS.map(({ key, label }) => (
            <Field key={key} label={`${label} URL（任意）`}>
              <TextInput
                style={styles.input}
                value={form[key]}
                onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                placeholder="https://..."
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
              />
            </Field>
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.saveBtnWrapper}>
          <Button
            label={saving ? 'アップロード中...' : isEditing ? '更新する' : '保存する'}
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
      <Header title="Music管理" onBack={() => router.replace('/(tabs)/admin')} />

      <View style={styles.flex}>
        <ScrollView contentContainerStyle={styles.list}>
          {musics.length === 0 && <Text style={styles.emptyText}>Musicがありません</Text>}
          {musics.map(music => (
            <View key={music.id} style={styles.row}>
              {music.jacket_url ? (
                <Image source={{ uri: music.jacket_url }} style={styles.rowThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.rowThumb, styles.rowThumbEmpty]}>
                  <Text style={{ fontSize: 20 }}>🎵</Text>
                </View>
              )}
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>{music.title}</Text>
                <Text style={styles.rowSub}>{music.type}　順: {music.sort_order}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(music)}>
                <Text style={styles.editBtnText}>編集</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(music)}>
                <Text style={styles.deleteBtnText}>削除</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <View style={styles.addWrapper}>
          <Button label="＋ Musicを追加" onPress={openNew} />
        </View>
      </View>
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
  rowThumb: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  rowThumbEmpty: { backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  rowInfo: { flex: 1 },
  rowTitle: { color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  rowSub: { color: Colors.textSecondary, fontSize: 12 },
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
    ...fonts.jpRegular,
    color: Colors.textSecondary, fontSize: 12, marginBottom: 8, letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.background, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeBtnText: { color: Colors.textSecondary, fontSize: 14 },
  typeBtnTextActive: { color: '#fff', fontWeight: '700' },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginHorizontal: 20, marginTop: 12 },
  saveBtnWrapper: { marginHorizontal: 20, marginTop: 24 },
});
