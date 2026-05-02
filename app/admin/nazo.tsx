import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useFocusEffect } from 'expo-router';
import { getPcNazos, createPcNazo, deletePcNazo, uploadNazoImage } from '@/lib/pc-nazo';
import { PcNazo } from '@/lib/types';
import { Colors } from '@/constants/colors';

const INIT_FORM = {
  title: '',
  date: '',
  body: '',
  answersRaw: '',
  answerDisplay: '',
};

export default function AdminNazoScreen() {
  const router = useRouter();
  const [nazos, setNazos] = useState<PcNazo[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [form, setForm] = useState(INIT_FORM);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setNazos(await getPcNazos());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('カメラロールへのアクセスを許可してください');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageMime(result.assets[0].mimeType ?? undefined);
    }
  }

  async function handleSave() {
    setError('');
    if (!form.title.trim() || !form.date.trim() || !form.body.trim()) {
      setError('タイトル・日付・本文は必須です');
      return;
    }
    if (!imageUri) {
      setError('画像を選択してください');
      return;
    }
    if (!form.answersRaw.trim() || !form.answerDisplay.trim()) {
      setError('正解リストと表示用正解は必須です');
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await uploadNazoImage(imageUri, imageMime);
      const correctAnswers = form.answersRaw.split(',').map(s => s.trim()).filter(Boolean);
      await createPcNazo({
        title: form.title.trim(),
        date: form.date.trim(),
        body: form.body.trim(),
        image_url: imageUrl,
        correct_answers: correctAnswers,
        answer_display: form.answerDisplay.trim(),
      });
      setForm(INIT_FORM);
      setImageUri(null);
      setMode('list');
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setError(msg || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(nazo: PcNazo) {
    if (Platform.OS === 'web') {
      if (!window.confirm(`「${nazo.title}」を削除しますか？`)) return;
      try {
        await deletePcNazo(nazo.id);
        await load();
      } catch {
        alert('削除に失敗しました');
      }
    } else {
      Alert.alert('削除確認', `「${nazo.title}」を削除しますか？`, [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除', style: 'destructive', onPress: async () => {
            try {
              await deletePcNazo(nazo.id);
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
          <TouchableOpacity onPress={() => { setMode('list'); setImageUri(null); setForm(INIT_FORM); setError(''); }} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>PC謎追加</Text>
        </View>

        <View style={styles.formCard}>
          <Field label="タイトル *">
            <TextInput style={styles.input} value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="第1問" placeholderTextColor={Colors.textSecondary} />
          </Field>
          <Field label="日付 * （例: 2026-05-01）">
            <TextInput style={styles.input} value={form.date} onChangeText={v => setForm(f => ({ ...f, date: v }))} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSecondary} />
          </Field>
          <Field label="本文 * （1行ヒントなど）">
            <TextInput style={styles.input} value={form.body} onChangeText={v => setForm(f => ({ ...f, body: v }))} placeholder="三つの扉の向こうに答えがある" placeholderTextColor={Colors.textSecondary} />
          </Field>
          <Field label="パズル画像 *">
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />
              ) : (
                <Text style={styles.imagePickerText}>📷 カメラロールから選択</Text>
              )}
            </TouchableOpacity>
            {imageUri && (
              <TouchableOpacity onPress={() => setImageUri(null)} style={styles.imageClearBtn}>
                <Text style={styles.imageClearText}>画像を変更</Text>
              </TouchableOpacity>
            )}
          </Field>
          <Field label="正解リスト * （カンマ区切り）">
            <TextInput
              style={styles.input}
              value={form.answersRaw}
              onChangeText={v => setForm(f => ({ ...f, answersRaw: v }))}
              placeholder="こたえ,答え,kotae"
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.fieldHint}>スペース・大文字小文字・全角半角は自動で吸収されます</Text>
          </Field>
          <Field label="表示用正解 * （正解後に表示する答え）">
            <TextInput
              style={styles.input}
              value={form.answerDisplay}
              onChangeText={v => setForm(f => ({ ...f, answerDisplay: v }))}
              placeholder="こたえ"
              placeholderTextColor={Colors.textSecondary}
            />
          </Field>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <View style={styles.savingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[styles.saveBtnText, { marginLeft: 8 }]}>アップロード中...</Text>
            </View>
          ) : (
            <Text style={styles.saveBtnText}>保存する</Text>
          )}
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
          <Text style={styles.title}>PC謎管理</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setMode('form')}>
            <Text style={styles.addBtnText}>＋ 追加</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {nazos.length === 0 && <Text style={styles.emptyText}>PC謎がありません</Text>}
        {nazos.map(nazo => (
          <View key={nazo.id} style={styles.row}>
            {nazo.image_url ? (
              <Image source={{ uri: nazo.image_url }} style={styles.rowThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.rowThumb, styles.rowThumbEmpty]}>
                <Text style={{ fontSize: 20 }}>🔐</Text>
              </View>
            )}
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>{nazo.title}</Text>
              <Text style={styles.rowSub}>
                {new Date(nazo.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
              <Text style={styles.rowAnswer}>こたえ: {nazo.answer_display}</Text>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(nazo)}>
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
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  rowThumb: { width: 56, height: 56, borderRadius: 8, marginRight: 12 },
  rowThumbEmpty: { backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center' },
  rowInfo: { flex: 1 },
  rowTitle: { color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  rowSub: { color: Colors.textSecondary, fontSize: 12, marginBottom: 2 },
  rowAnswer: { color: Colors.primary, fontSize: 12 },
  deleteBtn: { backgroundColor: Colors.error + '22', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8 },
  deleteBtnText: { color: Colors.error, fontSize: 13, fontWeight: '600' },
  formScroll: { paddingBottom: 60 },
  formCard: {
    marginHorizontal: 24, backgroundColor: Colors.surface,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border,
  },
  field: { marginBottom: 18 },
  fieldLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
  fieldHint: { color: Colors.textSecondary, fontSize: 11, marginTop: 6 },
  input: {
    backgroundColor: Colors.background, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, fontSize: 15,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  imagePicker: {
    backgroundColor: Colors.background, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    height: 180, justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  imagePickerText: { color: Colors.textSecondary, fontSize: 15 },
  imagePreview: { width: '100%', height: '100%' },
  imageClearBtn: { marginTop: 8, alignSelf: 'flex-start' },
  imageClearText: { color: Colors.primary, fontSize: 13 },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginHorizontal: 24, marginTop: 12 },
  saveBtn: {
    marginHorizontal: 24, marginTop: 24,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  savingRow: { flexDirection: 'row', alignItems: 'center' },
});
