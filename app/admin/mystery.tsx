import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView, TextInput, Modal, Switch, Platform, KeyboardAvoidingView, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useFocusEffect } from 'expo-router';
import { getMysteries, createMystery, updateMystery, deleteMystery, uploadMysteryImage } from '@/lib/mysteries';
import { sendPushNotificationToAll } from '@/lib/notifications';
import { Mystery } from '@/lib/types';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { fonts } from '@/lib/fonts';

const EMPTY_FORM = {
  vol: '', title: '', content: '', hint: '', answer: '', is_published: false,
};

export default function AdminMysteryScreen() {
  const router = useRouter();
  const [mysteries, setMysteries] = useState<Mystery[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | undefined>(undefined);
  const [answerCandidates, setAnswerCandidates] = useState<Array<{ text: string; selected: boolean }>>([]);
  const [candidatesShown, setCandidatesShown] = useState(false);
  const [sendNotif, setSendNotif] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMysteries(await getMysteries());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function toHiragana(str: string) {
    return str.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  }
  function toKatakana(str: string) {
    return str.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
  }
  function buildVariants(input: string): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    const add = (v: string) => {
      const t = v.trim();
      if (t && !seen.has(t)) { seen.add(t); result.push(t); }
    };
    add(input);
    add(input.toLowerCase());
    add(input.replace(/\s+/g, ''));
    add(input.toLowerCase().replace(/\s+/g, ''));
    add(toHiragana(input));
    add(toKatakana(input));
    add(toHiragana(input).replace(/\s+/g, ''));
    add(toKatakana(input).replace(/\s+/g, ''));
    return result;
  }

  function handleGenerateCandidates() {
    const variants = buildVariants(form.answer.trim());
    setAnswerCandidates(variants.map(text => ({ text, selected: true })));
    setCandidatesShown(true);
  }
  function resetCandidates() {
    setAnswerCandidates([]);
    setCandidatesShown(false);
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'カメラロールへのアクセスを許可してください');
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

  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageUri(null);
    setImageMime(undefined);
    resetCandidates();
    setSendNotif(false);
    setModalVisible(true);
  }

  function openEditModal(mystery: Mystery) {
    setEditingId(mystery.id);
    const raw = mystery.answer ?? '';
    let canonical = raw;
    let restored: Array<{ text: string; selected: boolean }> = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        canonical = parsed[0] as string;
        restored = (parsed as string[]).map(text => ({ text, selected: true }));
      }
    } catch {}
    setForm({
      vol: String(mystery.vol),
      title: mystery.title,
      content: mystery.content,
      hint: mystery.hint ?? '',
      answer: canonical,
      is_published: mystery.is_published,
    });
    setImageUri(mystery.image_url ?? null);
    setImageMime(undefined);
    setAnswerCandidates(restored);
    setCandidatesShown(restored.length > 0);
    setSendNotif(false);
    setModalVisible(true);
  }

  async function handleSave() {
    const vol = parseInt(form.vol, 10);
    if (!form.vol || isNaN(vol) || vol < 1) {
      Alert.alert('エラー', 'Vol番号を正しく入力してください');
      return;
    }
    if (!form.title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }
    setSaving(true);
    const selectedVariants = candidatesShown
      ? answerCandidates.filter(c => c.selected).map(c => c.text)
      : form.answer.trim() ? [form.answer.trim()] : [];
    const answerValue = selectedVariants.length > 0
      ? JSON.stringify(selectedVariants)
      : undefined;

    let uploadedImageUrl: string | undefined;
    if (imageUri) {
      const editingMystery = mysteries.find(m => m.id === editingId);
      const isNewImage = editingMystery ? imageUri !== editingMystery.image_url : true;
      if (isNewImage) {
        uploadedImageUrl = await uploadMysteryImage(imageUri, imageMime).catch(e => {
          Alert.alert('画像アップロードエラー', e instanceof Error ? e.message : 'アップロードに失敗しました');
          return undefined;
        });
        if (uploadedImageUrl === undefined) { setSaving(false); return; }
      } else {
        uploadedImageUrl = imageUri;
      }
    }

    const payload = {
      vol,
      title: form.title.trim(),
      content: form.content.trim(),
      image_url: uploadedImageUrl,
      hint: form.hint.trim() || undefined,
      answer: answerValue,
      is_published: form.is_published,
    };
    try {
      if (editingId) {
        await updateMystery(editingId, payload);
      } else {
        await createMystery(payload);
      }
      if (sendNotif && form.is_published) {
        await sendPushNotificationToAll(
          '新しい謎',
          `Vol.${vol}「${form.title.trim()}」が公開されました 🔍`,
        ).catch(() => {});
      }
      setModalVisible(false);
      await load();
    } catch (e) {
      Alert.alert('保存エラー', e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublished(mystery: Mystery) {
    try {
      await updateMystery(mystery.id, { is_published: !mystery.is_published });
      setMysteries(prev =>
        prev.map(m => m.id === mystery.id ? { ...m, is_published: !m.is_published } : m)
      );
    } catch {
      Alert.alert('エラー', '更新に失敗しました');
    }
  }

  function handleDelete(mystery: Mystery) {
    Alert.alert(
      '削除確認',
      `Vol.${mystery.vol}「${mystery.title}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除', style: 'destructive',
          onPress: async () => {
            try {
              await deleteMystery(mystery.id);
              await load();
            } catch {
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <Header title="謎管理" onBack={() => router.replace('/(tabs)/admin' as any)} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <View style={styles.flex}>
          <ScrollView contentContainerStyle={styles.list}>
            {mysteries.length === 0 && (
              <Text style={styles.emptyText}>謎がまだありません</Text>
            )}
            {mysteries.map(mystery => (
              <View key={mystery.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardVol}>Vol.{mystery.vol}</Text>
                    <Text style={styles.cardTitle}>{mystery.title}</Text>
                  </View>
                  <Switch
                    value={mystery.is_published}
                    onValueChange={() => handleTogglePublished(mystery)}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor="#fff"
                  />
                </View>
                <Text style={styles.cardStatus}>
                  {mystery.is_published ? '公開中' : '非公開'}
                </Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(mystery)}>
                    <Text style={styles.editBtnText}>編集</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(mystery)}>
                    <Text style={styles.deleteBtnText}>削除</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.addWrapper}>
            <Button label="＋ 謎を追加" onPress={openAddModal} />
          </View>
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingId ? '謎を編集' : '謎を追加'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color={Colors.primary} size="small" />
                : <Text style={styles.modalSave}>保存</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Vol番号</Text>
            <TextInput
              style={styles.input}
              value={form.vol}
              onChangeText={v => setForm(f => ({ ...f, vol: v }))}
              keyboardType="number-pad"
              placeholder="例: 1"
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.fieldLabel}>タイトル</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={v => setForm(f => ({ ...f, title: v }))}
              placeholder="例: クロスワード"
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.fieldLabel}>画像（任意）</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />
              ) : (
                <Text style={styles.imagePickerText}>📷 タップして画像を選択</Text>
              )}
            </TouchableOpacity>
            {imageUri && (
              <TouchableOpacity onPress={pickImage} style={styles.imageChangeBtn}>
                <Text style={styles.imageChangeBtnText}>画像を変更</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.fieldLabel}>本文（謎の説明・任意）</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.content}
              onChangeText={v => setForm(f => ({ ...f, content: v }))}
              placeholder="謎の説明テキストを入力..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>ヒント（任意）</Text>
            <TextInput
              style={[styles.input, styles.hintArea]}
              value={form.hint}
              onChangeText={v => setForm(f => ({ ...f, hint: v }))}
              placeholder="ヒントを入力..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>答え（任意）</Text>
            <View style={styles.answerRow}>
              <TextInput
                style={[styles.input, styles.answerInput]}
                value={form.answer}
                onChangeText={v => {
                  setForm(f => ({ ...f, answer: v }));
                  if (candidatesShown) resetCandidates();
                }}
                placeholder="正解のテキストを入力"
                placeholderTextColor={Colors.textSecondary}
              />
              <TouchableOpacity
                style={[styles.genBtn, !form.answer.trim() && styles.genBtnDisabled]}
                onPress={handleGenerateCandidates}
                disabled={!form.answer.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.genBtnText}>候補</Text>
              </TouchableOpacity>
            </View>
            {candidatesShown && answerCandidates.length > 0 && (
              <View style={styles.candidatesBox}>
                <Text style={styles.candidatesHint}>採用する表記にチェック</Text>
                {answerCandidates.map((c, i) => (
                  <TouchableOpacity
                    key={c.text}
                    style={styles.candidateRow}
                    onPress={() => setAnswerCandidates(prev =>
                      prev.map((item, idx) => idx === i ? { ...item, selected: !item.selected } : item)
                    )}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkBox, c.selected && styles.checkBoxChecked]}>
                      {c.selected && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                    <Text style={[styles.candidateText, !c.selected && styles.candidateTextOff]}>
                      {c.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>公開する</Text>
              <Switch
                value={form.is_published}
                onValueChange={v => setForm(f => ({ ...f, is_published: v }))}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabelGroup}>
                <Text style={styles.fieldLabel}>プッシュ通知を送信する</Text>
                {sendNotif && (
                  <Text style={styles.notifPreview}>
                    Vol.{form.vol || '?'}「{form.title.trim() || '(タイトル)'}」が公開されました 🔍
                  </Text>
                )}
              </View>
              <Switch
                value={sendNotif}
                onValueChange={setSendNotif}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#fff"
                disabled={!form.is_published}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  list: { padding: 20, gap: 12, paddingBottom: 100 },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, fontSize: 14, marginTop: 40 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, padding: 16, gap: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardInfo: { gap: 2, flex: 1 },
  cardVol: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  cardStatus: { fontSize: 11, color: Colors.textSecondary },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  editBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
  },
  editBtnText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  deleteBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#fee2e2' },
  deleteBtnText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },

  addWrapper: { position: 'absolute', bottom: 24, left: 20, right: 20 },

  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  modalCancel: { fontSize: 15, color: Colors.textSecondary },
  modalSave: { fontSize: 15, color: Colors.primary, fontWeight: '700' },
  modalContent: { padding: 20, gap: 4, paddingBottom: 60 },

  fieldLabel: {
    fontFamily: fonts.regular,
    fontSize: 12, fontWeight: '600', color: Colors.textSecondary,
    letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 16, marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.text,
  },
  textArea: { minHeight: 160, paddingTop: 12 },
  hintArea: { minHeight: 80, paddingTop: 12 },

  imagePicker: {
    backgroundColor: Colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    height: 160, justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  imagePickerText: { color: Colors.textSecondary, fontSize: 14 },
  imagePreview: { width: '100%', height: '100%' },
  imageChangeBtn: { marginTop: 6, alignSelf: 'flex-start' },
  imageChangeBtnText: { color: Colors.primary, fontSize: 13 },

  answerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  answerInput: { flex: 1 },
  genBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  genBtnDisabled: { backgroundColor: Colors.border },
  genBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  candidatesBox: { marginTop: 8, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, gap: 8 },
  candidatesHint: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 0.3, marginBottom: 4 },
  candidateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  checkBox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
  },
  checkBoxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  candidateText: { fontSize: 14, color: Colors.text, flex: 1 },
  candidateTextOff: { color: Colors.textSecondary, textDecorationLine: 'line-through' },

  switchRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginTop: 20,
  },
  switchLabelGroup: { flex: 1, marginRight: 12 },
  notifPreview: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
});
