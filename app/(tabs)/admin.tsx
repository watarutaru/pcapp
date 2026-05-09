import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView, TextInput, Modal, Switch, Platform, KeyboardAvoidingView,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { getLives, checkinToLive } from '@/lib/lives';
import { addPoints, getProfile } from '@/lib/profiles';
import { getMysteries, createMystery, updateMystery, deleteMystery } from '@/lib/mysteries';
import { Live, Mystery } from '@/lib/types';
import { Colors } from '@/constants/colors';

type AdminTab = 'qr' | 'nazo';
type QrStep = 'scan' | 'select_live';

const EMPTY_FORM = { vol: '', title: '', content: '', image_url: '', hint: '', answer: '', is_published: false };

export default function AdminScreen() {
  const [adminTab, setAdminTab] = useState<AdminTab>('qr');

  // QRスキャン
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [qrStep, setQrStep] = useState<QrStep>('scan');
  const [scannedUserId, setScannedUserId] = useState<string | null>(null);
  const [lives, setLives] = useState<Live[]>([]);
  const [processing, setProcessing] = useState(false);
  const [livesLoading, setLivesLoading] = useState(false);

  // ナゾ管理
  const [mysteries, setMysteries] = useState<Mystery[]>([]);
  const [nazoLoading, setNazoLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [answerCandidates, setAnswerCandidates] = useState<Array<{ text: string; selected: boolean }>>([]);
  const [candidatesShown, setCandidatesShown] = useState(false);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  const loadMysteries = useCallback(async () => {
    setNazoLoading(true);
    const data = await getMysteries();
    setMysteries(data);
    setNazoLoading(false);
  }, []);

  useEffect(() => {
    if (adminTab === 'nazo') loadMysteries();
  }, [adminTab, loadMysteries]);

  // ── QRスキャン ──────────────────────────────
  async function handleBarCodeScanned({ data }: { data: string }) {
    if (qrStep !== 'scan' || processing) return;
    setProcessing(true);
    const userId = data.trim();
    if (!userId) {
      Alert.alert('エラー', '無効なQRコードです');
      setProcessing(false);
      return;
    }
    const profile = await getProfile(userId);
    if (!profile) {
      Alert.alert('エラー', '会員が見つかりません', [
        { text: 'OK', onPress: () => setProcessing(false) },
      ]);
      return;
    }
    setScannedUserId(userId);
    setLivesLoading(true);
    setLives(await getLives());
    setLivesLoading(false);
    setQrStep('select_live');
    setProcessing(false);
  }

  async function handleSelectLive(live: Live) {
    if (!scannedUserId) return;
    setProcessing(true);
    try {
      const profile = await getProfile(scannedUserId);
      const isNew = await checkinToLive(scannedUserId, live.id);
      if (!isNew) {
        Alert.alert(
          'チェックイン済み',
          `${profile?.nickname ?? '会員'} はすでに\n${live.title}\nにチェックイン済みです`,
          [{ text: 'OK', onPress: resetScan }],
        );
        return;
      }
      await addPoints(scannedUserId, 50, `ライブ参戦: ${live.title}`);
      const updated = await getProfile(scannedUserId);
      Alert.alert(
        'チェックイン完了！',
        `${updated?.nickname ?? '会員'}\n\n${live.title}\n50ポイントを付与しました\n合計: ${updated?.total_points ?? '?'}pt`,
        [{ text: 'OK', onPress: resetScan }],
      );
    } catch (e) {
      Alert.alert('エラー', e instanceof Error ? e.message : 'エラーが発生しました', [
        { text: 'OK', onPress: () => setProcessing(false) },
      ]);
    }
  }

  function resetScan() {
    setScannedUserId(null);
    setLives([]);
    setQrStep('scan');
    setProcessing(false);
  }

  // ── 答えバリエーション生成 ──────────────────────────
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

  // ── ナゾ管理 ──────────────────────────────
  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    resetCandidates();
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
      image_url: mystery.image_url ?? '',
      hint: mystery.hint ?? '',
      answer: canonical,
      is_published: mystery.is_published,
    });
    setAnswerCandidates(restored);
    setCandidatesShown(restored.length > 0);
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
    const payload = {
      vol,
      title: form.title.trim(),
      content: form.content.trim(),
      image_url: form.image_url.trim() || undefined,
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
      setModalVisible(false);
      await loadMysteries();
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
    } catch (e) {
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
              await loadMysteries();
            } catch (e) {
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ],
    );
  }

  // ── レンダリング ──────────────────────────
  return (
    <View style={styles.container}>
      {/* 管理タブ切り替え */}
      <View style={styles.adminTabBar}>
        <TouchableOpacity
          style={[styles.adminTab, adminTab === 'qr' && styles.adminTabActive]}
          onPress={() => setAdminTab('qr')}
        >
          <Text style={[styles.adminTabText, adminTab === 'qr' && styles.adminTabTextActive]}>
            QRスキャン
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.adminTab, adminTab === 'nazo' && styles.adminTabActive]}
          onPress={() => setAdminTab('nazo')}
        >
          <Text style={[styles.adminTabText, adminTab === 'nazo' && styles.adminTabTextActive]}>
            ナゾ管理
          </Text>
        </TouchableOpacity>
      </View>

      {/* QRスキャン */}
      {adminTab === 'qr' && (
        <View style={styles.flex}>
          {hasPermission === null && (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          )}
          {hasPermission === false && (
            <View style={styles.center}>
              <Text style={styles.errorText}>カメラへのアクセスが許可されていません</Text>
            </View>
          )}
          {hasPermission === true && qrStep === 'scan' && (
            <CameraView
              style={styles.camera}
              onBarcodeScanned={processing ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            >
              <View style={styles.overlay}>
                <Text style={styles.instruction}>会員証QRコードを読み取ってください</Text>
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                {processing && (
                  <View style={styles.processingBadge}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.processingText}>確認中...</Text>
                  </View>
                )}
              </View>
            </CameraView>
          )}
          {hasPermission === true && qrStep === 'select_live' && (
            <View style={styles.selectContainer}>
              <View style={styles.selectHeader}>
                <Text style={styles.selectTitle}>ライブを選択</Text>
                <Text style={styles.selectSub}>チェックインするライブを選んでください</Text>
              </View>
              {livesLoading ? (
                <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
              ) : (
                <ScrollView style={styles.liveList}>
                  {lives.map(live => (
                    <TouchableOpacity
                      key={live.id}
                      style={styles.liveItem}
                      onPress={() => handleSelectLive(live)}
                      disabled={processing}
                    >
                      <View style={styles.liveInfo}>
                        <Text style={styles.liveTitle}>{live.title}</Text>
                        <Text style={styles.liveMeta}>
                          {new Date(live.date).toLocaleDateString('ja-JP', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}{'  '}{live.venue}
                        </Text>
                      </View>
                      {processing
                        ? <ActivityIndicator color={Colors.primary} size="small" />
                        : <Text style={styles.liveArrow}>+50pt →</Text>
                      }
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <TouchableOpacity style={styles.cancelButton} onPress={resetScan}>
                <Text style={styles.cancelText}>キャンセル（スキャンに戻る）</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ナゾ管理 */}
      {adminTab === 'nazo' && (
        <View style={styles.flex}>
          {nazoLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.nazoList}>
              {mysteries.length === 0 && (
                <Text style={styles.emptyText}>謎がまだありません</Text>
              )}
              {mysteries.map(mystery => (
                <View key={mystery.id} style={styles.nazoCard}>
                  <View style={styles.nazoCardTop}>
                    <View style={styles.nazoCardInfo}>
                      <Text style={styles.nazoVol}>Vol.{mystery.vol}</Text>
                      <Text style={styles.nazoTitle}>{mystery.title}</Text>
                    </View>
                    <Switch
                      value={mystery.is_published}
                      onValueChange={() => handleTogglePublished(mystery)}
                      trackColor={{ false: Colors.border, true: Colors.primary }}
                      thumbColor="#fff"
                    />
                  </View>
                  <Text style={styles.nazoPublishedLabel}>
                    {mystery.is_published ? '公開中' : '非公開'}
                  </Text>
                  <View style={styles.nazoCardActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditModal(mystery)}
                    >
                      <Text style={styles.editButtonText}>編集</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(mystery)}
                    >
                      <Text style={styles.deleteButtonText}>削除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>＋ 謎を追加</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 追加 / 編集モーダル */}
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

            <Text style={styles.fieldLabel}>画像URL（任意）</Text>
            <TextInput
              style={styles.input}
              value={form.image_url}
              onChangeText={v => setForm(f => ({ ...f, image_url: v }))}
              placeholder="https://..."
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              keyboardType="url"
            />

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
            <View style={styles.answerInputRow}>
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
                style={[styles.genButton, !form.answer.trim() && styles.genButtonDisabled]}
                onPress={handleGenerateCandidates}
                disabled={!form.answer.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.genButtonText}>候補</Text>
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

            <View style={styles.publishRow}>
              <Text style={styles.fieldLabel}>公開する</Text>
              <Switch
                value={form.is_published}
                onValueChange={v => setForm(f => ({ ...f, is_published: v }))}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: {
    color: Colors.textSecondary, fontSize: 16, textAlign: 'center', paddingHorizontal: 40,
  },

  // 管理タブバー
  adminTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  adminTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  adminTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  adminTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  adminTabTextActive: {
    color: '#fff',
  },

  // QRスキャン
  camera: { flex: 1 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  instruction: {
    color: '#fff', fontSize: 15, marginBottom: 40, textAlign: 'center', paddingHorizontal: 40,
  },
  scanFrame: { width: 240, height: 240, position: 'relative' },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: Colors.primary,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  topRight: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  processingBadge: {
    marginTop: 40, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
  },
  processingText: { color: '#fff', fontSize: 14, marginLeft: 8 },
  selectContainer: { flex: 1, backgroundColor: Colors.background },
  selectHeader: { paddingHorizontal: 24, paddingVertical: 20 },
  selectTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  selectSub: { fontSize: 14, color: Colors.textSecondary },
  liveList: { flex: 1, paddingHorizontal: 24 },
  liveItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  liveInfo: { flex: 1 },
  liveTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  liveMeta: { fontSize: 12, color: Colors.textSecondary },
  liveArrow: { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  cancelButton: {
    margin: 24, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  cancelText: { color: Colors.textSecondary, fontSize: 14 },

  // ナゾ管理
  nazoList: {
    padding: 20,
    gap: 12,
    paddingBottom: 100,
  },
  emptyText: {
    textAlign: 'center', color: Colors.textSecondary, fontSize: 14, marginTop: 40,
  },
  nazoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 8,
  },
  nazoCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nazoCardInfo: { gap: 2, flex: 1 },
  nazoVol: {
    fontSize: 11, color: Colors.textSecondary, fontWeight: '600', letterSpacing: 0.5,
  },
  nazoTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  nazoPublishedLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  nazoCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  editButton: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
  },
  editButtonText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  deleteButton: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: 8, backgroundColor: '#fee2e2',
  },
  deleteButtonText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
  addButton: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // モーダル
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  modalCancel: { fontSize: 15, color: Colors.textSecondary },
  modalSave: { fontSize: 15, color: Colors.primary, fontWeight: '700' },
  modalContent: { padding: 20, gap: 4, paddingBottom: 60 },
  fieldLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textSecondary,
    letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 16, marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  textArea: {
    minHeight: 160,
    paddingTop: 12,
  },
  hintArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  answerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  answerInput: {
    flex: 1,
  },
  genButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  genButtonDisabled: {
    backgroundColor: Colors.border,
  },
  genButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  candidatesBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  candidatesHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  candidateText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  candidateTextOff: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  publishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});
