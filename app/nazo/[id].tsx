import { fonts } from '@/lib/fonts';
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  TextInput, Image, Platform, KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getMystery, getMysteries } from '@/lib/mysteries';
import { Mystery } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useUnread } from '@/lib/UnreadContext';

const closeSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6l12 12" stroke="#222222" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const chevronSvg = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 12L6 8L10 4" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const bulbSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 17h6M9 20h6M8.5 14.5C6.6 13.3 5.5 11.3 5.5 9a6.5 6.5 0 0 1 13 0c0 2.3-1.1 4.3-3 5.5V17h-7v-2.5z" stroke="#222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const lockOpenSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" stroke-width="1.5"/>
  <path d="M7 11V7a5 5 0 0 1 9.9-1" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const lockOpenRedSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="11" width="18" height="11" rx="2" stroke="#ea6025" stroke-width="1.5"/>
  <path d="M7 11V7a5 5 0 0 1 9.9-1" stroke="#ea6025" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const arrowLeftSvg = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 12L6 8L10 4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const arrowRightSvg = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 4L10 8L6 12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

type AnswerState = 'idle' | 'wrong' | 'correct';

export default function NazoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [mystery, setMystery] = useState<Mystery | null>(null);
  const [loading, setLoading] = useState(true);
  const [hintOpen, setHintOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [showExplanation, setShowExplanation] = useState(false);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const { markRead } = useUnread();

  useEffect(() => {
    Promise.all([getMystery(id), getMysteries()]).then(([data, all]) => {
      setMystery(data);
      const published = all.filter(m => m.is_published);
      const idx = published.findIndex(m => m.id === id);
      setPrevId(idx > 0 ? published[idx - 1].id : null);
      setNextId(idx >= 0 && idx < published.length - 1 ? published[idx + 1].id : null);
      setLoading(false);
    });
    markRead('mystery', id);
  }, [id, markRead]);

  function handleSubmit() {
    if (!mystery?.answer) return;
    const input = answer.trim().toLowerCase();
    let variants: string[];
    try {
      const parsed = JSON.parse(mystery.answer);
      variants = Array.isArray(parsed) ? (parsed as string[]) : [mystery.answer];
    } catch {
      variants = [mystery.answer];
    }
    const correct = variants.some(v => input === v.trim().toLowerCase());
    if (correct) {
      setAnswerState('correct');
      // 解説画像があればデフォルトで解説を表示
      setShowExplanation(true);
    } else {
      setAnswerState('wrong');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!mystery) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>謎が見つかりません</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCorrect = answerState === 'correct';
  const hasExplanationImage = !!mystery.explanation_image_url;
  // 表示する画像を決定
  const displayImageUrl = isCorrect && showExplanation && hasExplanationImage
    ? mystery.explanation_image_url!
    : mystery.image_url;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NAZO</Text>
      </View>

      {/* コンテンツカード */}
      <View style={styles.card}>
        {/* 閉じるボタン */}
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} activeOpacity={0.7}>
          <SvgXml xml={closeSvg} width={24} height={24} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.cardContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Vol + タイトル + 正解ステータス */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <View style={styles.titleTexts}>
                <Text style={styles.volText}>Vol.{mystery.vol}</Text>
                <Text style={styles.titleText}>{mystery.title}</Text>
              </View>
              {isCorrect && (
                <View style={styles.decodeBadge}>
                  <SvgXml xml={lockOpenRedSvg} width={20} height={20} />
                  <Text style={styles.decodeBadgeText}>Decode</Text>
                </View>
              )}
            </View>
          </View>

          {/* 謎画像 */}
          {displayImageUrl ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: displayImageUrl }}
                style={styles.mysteryImage}
                resizeMode="cover"
              />
              {/* 正解後の画像切り替えボタン（解説画像がある場合のみ） */}
              {isCorrect && hasExplanationImage && (
                <TouchableOpacity
                  style={styles.imageSwitchBtn}
                  onPress={() => setShowExplanation(v => !v)}
                  activeOpacity={0.8}
                >
                  <SvgXml
                    xml={showExplanation ? arrowLeftSvg : arrowRightSvg}
                    width={16}
                    height={16}
                  />
                  <Text style={styles.imageSwitchText}>
                    {showExplanation ? '問題へ' : '解説へ'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : mystery.content ? (
            <Text style={styles.contentText}>{mystery.content}</Text>
          ) : null}

          {/* HINT アコーディオン（解説表示中は非表示） */}
          {mystery.hint && !(isCorrect && showExplanation) ? (
            <TouchableOpacity
              style={styles.hintBox}
              onPress={() => setHintOpen(v => !v)}
              activeOpacity={0.8}
            >
              <View style={styles.hintHeader}>
                <View style={styles.hintTitleRow}>
                  <SvgXml xml={bulbSvg} width={24} height={24} />
                  <Text style={styles.hintLabel}>HINT</Text>
                </View>
                <Text style={styles.hintArrow}>{hintOpen ? '∧' : '∨'}</Text>
              </View>
              {hintOpen && (
                <Text style={styles.hintText}>{mystery.hint}</Text>
              )}
            </TouchableOpacity>
          ) : null}

          {/* 回答エリア */}
          {mystery.answer && answerState !== 'correct' ? (
            <View style={styles.answerSection}>
              <View style={styles.answerRow}>
                <TextInput
                  style={styles.answerInput}
                  value={answer}
                  onChangeText={text => {
                    setAnswer(text);
                    if (answerState === 'wrong') setAnswerState('idle');
                  }}
                  placeholder=""
                  placeholderTextColor={Colors.textSecondary}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitButtonText}>送信</Text>
                </TouchableOpacity>
              </View>
              {answerState === 'wrong' && (
                <View style={styles.wrongBanner}>
                  <Text style={styles.wrongIcon}>🤔</Text>
                  <Text style={styles.wrongText}>残念！ もう一回トライしてみるのじゃ</Text>
                </View>
              )}
            </View>
          ) : null}

          {/* 正解バナー */}
          {answerState === 'correct' && (
            <LinearGradient
              colors={['#654cab', '#ea6025']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.correctBanner}
            >
              <View style={styles.correctContent}>
                <SvgXml xml={lockOpenSvg} width={22} height={32} />
                <Text style={styles.correctTitle}>謎を解きあかした！</Text>
              </View>
            </LinearGradient>
          )}
        </ScrollView>
      </View>

      {/* 前後ナビ */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, !prevId && styles.navBtnDisabled]}
          onPress={() => prevId && router.replace(`/nazo/${prevId}` as any)}
          disabled={!prevId}
          activeOpacity={0.7}
        >
          <SvgXml xml={chevronSvg} width={16} height={16} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, !nextId && styles.navBtnDisabled]}
          onPress={() => nextId && router.replace(`/nazo/${nextId}` as any)}
          disabled={!nextId}
          activeOpacity={0.7}
        >
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <SvgXml xml={chevronSvg} width={16} height={16} />
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    ...fonts.condensed,
    fontSize: 24,
    color: Colors.text,
    letterSpacing: 1,
    lineHeight: 32,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginRight: 24,
    marginBottom: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 24,
  },
  titleSection: {
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleTexts: {
    flex: 1,
    gap: 8,
  },
  volText: {
    ...fonts.regular,
    fontSize: 16,
    color: '#222',
  },
  titleText: {
    ...fonts.jpBold,
    fontSize: 20,
    color: '#364153',
  },
  decodeBadge: {
    alignItems: 'center',
    gap: 2,
    paddingBottom: 2,
  },
  decodeBadgeText: {
    ...fonts.condensed,
    fontSize: 10,
    color: '#ea6025',
    letterSpacing: 0.5,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1000 / 750,
    borderWidth: 1,
    borderColor: '#efefef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  mysteryImage: {
    width: '100%',
    height: '100%',
  },
  imageSwitchBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopRightRadius: 10,
  },
  imageSwitchText: {
    ...fonts.jpRegular,
    fontSize: 14,
    color: '#fff',
    lineHeight: 14,
  },
  contentText: {
    ...fonts.jpLight,
    fontSize: 14,
    color: '#364153',
    lineHeight: 23,
  },
  hintBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hintTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 30,
  },
  hintLabel: {
    ...fonts.condensedMedium,
    fontSize: 18,
    color: '#222',
    letterSpacing: 1,
    lineHeight: 18,
  },
  hintArrow: {
    fontSize: 14,
    color: '#222',
  },
  hintText: {
    ...fonts.jpRegular,
    fontSize: 12,
    color: '#364153',
    lineHeight: 23,
  },
  answerSection: {
    gap: 8,
  },
  answerRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  answerInput: {
    ...fonts.regular,
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#364153',
  },
  submitButton: {
    width: 76,
    height: 44,
    backgroundColor: '#222',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    ...fonts.jpBold,
    color: '#fff',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  wrongBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffad8',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  wrongIcon: {
    fontSize: 20,
  },
  wrongText: {
    ...fonts.jpRegular,
    fontSize: 12,
    color: '#364153',
    lineHeight: 23,
  },
  correctBanner: {
    borderRadius: 4,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  correctContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  correctTitle: {
    ...fonts.jpBold,
    fontSize: 14,
    color: '#fff',
  },
  navBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#efefef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  navBtn: {
    backgroundColor: '#efefef',
    borderRadius: 60,
    padding: 10,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
});
