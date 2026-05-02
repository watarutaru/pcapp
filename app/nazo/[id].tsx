import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getPcNazo, getNazoResult, submitCorrectAnswer, checkAnswer } from '@/lib/pc-nazo';
import { supabase } from '@/lib/supabase';
import { PcNazo } from '@/lib/types';
import { Colors } from '@/constants/colors';

type ModalState = 'correct' | 'incorrect' | null;

export default function NazoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [nazo, setNazo] = useState<PcNazo | null>(null);
  const [solved, setSolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [nazoData, { data: { user } }] = await Promise.all([
        getPcNazo(id),
        supabase.auth.getUser(),
      ]);
      setNazo(nazoData);
      if (user && nazoData) {
        setUserId(user.id);
        const result = await getNazoResult(user.id, nazoData.id);
        setSolved(!!result);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSubmit() {
    if (!nazo || !userId || !answer.trim()) return;
    setSubmitting(true);
    const correct = checkAnswer(answer, nazo.correct_answers);
    if (correct) {
      await submitCorrectAnswer(userId, nazo.id);
      setSolved(true);
      setModal('correct');
    } else {
      setModal('incorrect');
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!nazo) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>謎が見つかりません</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← 戻る</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.date}>
            {new Date(nazo.date).toLocaleDateString('ja-JP', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </Text>
          <Text style={styles.title}>{nazo.title}</Text>
          <Text style={styles.body}>{nazo.body}</Text>

          <Image
            source={{ uri: nazo.image_url }}
            style={styles.image}
            resizeMode="contain"
          />

          {solved ? (
            <View style={styles.solvedCard}>
              <Text style={styles.solvedIcon}>✅</Text>
              <Text style={styles.solvedTitle}>正解！</Text>
              <View style={styles.answerBox}>
                <Text style={styles.answerLabel}>こたえ</Text>
                <Text style={styles.answerText}>{nazo.answer_display}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.answerSection}>
              <Text style={styles.answerSectionLabel}>解答</Text>
              <TextInput
                style={styles.input}
                value={answer}
                onChangeText={setAnswer}
                placeholder="答えを入力してください"
                placeholderTextColor={Colors.textSecondary}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                style={[styles.submitButton, (!answer.trim() || submitting) && styles.submitDisabled]}
                onPress={handleSubmit}
                disabled={!answer.trim() || submitting}
              >
                <Text style={styles.submitText}>
                  {submitting ? '判定中...' : '送信'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={modal !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {modal === 'correct' ? (
              <>
                <Text style={styles.modalIcon}>🎉</Text>
                <Text style={styles.modalTitle}>正解！</Text>
                <Text style={styles.modalBody}>おめでとうございます！</Text>
                <View style={styles.modalAnswerBox}>
                  <Text style={styles.modalAnswerLabel}>こたえ</Text>
                  <Text style={styles.modalAnswerText}>{nazo.answer_display}</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalIcon}>❌</Text>
                <Text style={styles.modalTitle}>不正解</Text>
                <Text style={styles.modalBody}>もう一度挑戦してみよう！</Text>
              </>
            )}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModal(null)}
            >
              <Text style={styles.modalButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: { color: Colors.textSecondary, fontSize: 16, marginBottom: 16 },
  backButton: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  backText: { color: '#fff', fontSize: 16 },
  scroll: { paddingBottom: 40 },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 8 },
  backBtn: { alignSelf: 'flex-start' },
  backBtnText: { color: Colors.primary, fontSize: 16 },
  content: { paddingHorizontal: 24 },
  date: { color: Colors.textSecondary, fontSize: 13, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 10 },
  body: { color: Colors.textSecondary, fontSize: 15, lineHeight: 24, marginBottom: 20 },
  image: {
    width: '100%', height: 280,
    borderRadius: 12, marginBottom: 28,
    backgroundColor: Colors.surface,
  },
  answerSection: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: Colors.border,
  },
  answerSectionLabel: {
    color: Colors.textSecondary, fontSize: 12, fontWeight: '600',
    letterSpacing: 1, marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.background, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, fontSize: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 14,
  },
  submitButton: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  solvedCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: Colors.success, alignItems: 'center',
  },
  solvedIcon: { fontSize: 40, marginBottom: 8 },
  solvedTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.success, marginBottom: 16 },
  answerBox: {
    backgroundColor: Colors.background, borderRadius: 12,
    padding: 16, width: '100%', alignItems: 'center',
  },
  answerLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 6 },
  answerText: { color: Colors.text, fontSize: 22, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: Colors.surface, borderRadius: 24,
    padding: 32, width: '100%', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  modalIcon: { fontSize: 52, marginBottom: 12 },
  modalTitle: { fontSize: 26, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  modalBody: { color: Colors.textSecondary, fontSize: 15, marginBottom: 20, textAlign: 'center' },
  modalAnswerBox: {
    backgroundColor: Colors.background, borderRadius: 12,
    padding: 16, width: '100%', alignItems: 'center', marginBottom: 20,
  },
  modalAnswerLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 6 },
  modalAnswerText: { color: Colors.text, fontSize: 22, fontWeight: 'bold' },
  modalButton: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 40, paddingVertical: 14,
  },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
