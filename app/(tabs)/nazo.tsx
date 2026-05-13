import { fonts } from '@/lib/fonts';
import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image, TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { getMysteries } from '@/lib/mysteries';
import { Mystery } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useUnread } from '@/lib/UnreadContext';
import ContentModal from '@/components/layout/ContentModal';
import { HintAccordion } from '@/components/ui';

const lockOpenSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" stroke-width="1.5"/>
  <path d="M7 11V7a5 5 0 0 1 9.9-1" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

type AnswerState = 'idle' | 'wrong' | 'correct';

export default function NazoScreen() {
  const [mysteries, setMysteries] = useState<Mystery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const { readIds, refresh: refreshUnread, markRead } = useUnread();

  const load = useCallback(async () => {
    const data = await getMysteries();
    setMysteries(data);
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshUnread()]);
    setRefreshing(false);
  }, [load, refreshUnread]);

  useFocusEffect(useCallback(() => {
    load();
    refreshUnread();
  }, [load, refreshUnread]));

  const publishedMysteries = mysteries.filter(m => m.is_published);
  const selectedMystery = selectedIndex >= 0 ? publishedMysteries[selectedIndex] : null;

  useEffect(() => {
    if (selectedMystery) {
      markRead('mystery', selectedMystery.id);
    }
  }, [selectedMystery?.id]);

  const handleClose = () => setSelectedIndex(-1);
  const handlePrev = () => setSelectedIndex(i => Math.max(0, i - 1));
  const handleNext = () => setSelectedIndex(i => Math.min(publishedMysteries.length - 1, i + 1));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>NAZO</Text>
      </View>

      <FlatList
        data={mysteries}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isPublished = item.is_published;
          const publishedIdx = publishedMysteries.findIndex(m => m.id === item.id);
          const isUnread = isPublished && !readIds.mystery.has(item.id);
          return (
            <View style={styles.cardWrapper}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => isPublished && setSelectedIndex(publishedIdx)}
                activeOpacity={isPublished ? 0.8 : 1}
              >
                <View style={styles.cardInfo}>
                  <Text style={styles.volText}>Vol.{item.vol}</Text>
                  <Text style={styles.titleText}>{item.title}</Text>
                </View>
                <View style={styles.lockContainer}>
                  <Image
                    source={
                      isPublished
                        ? require('@/assets/images/lock-open.png')
                        : require('@/assets/images/lock-closed.png')
                    }
                    style={styles.lockIcon}
                    resizeMode="contain"
                  />
                  {isPublished && (
                    <Text style={styles.decodeLabel}>Decode</Text>
                  )}
                </View>
              </TouchableOpacity>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>謎はまだありません</Text>
        }
      />

      {/* 詳細モーダル */}
      <ContentModal
        visible={selectedIndex >= 0}
        onClose={handleClose}
        title="NAZO"
        hasPrev={selectedIndex > 0}
        hasNext={selectedIndex < publishedMysteries.length - 1}
        onPrev={handlePrev}
        onNext={handleNext}
      >
        {selectedMystery && (
          <NazoModalContent
            mystery={selectedMystery}
            key={selectedMystery.id}
          />
        )}
      </ContentModal>
    </View>
  );
}

function NazoModalContent({ mystery }: { mystery: Mystery }) {
  const [hintOpen, setHintOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [answerState, setAnswerState] = useState<AnswerState>('idle');

  function handleSubmit() {
    if (!mystery.answer) return;
    const input = answer.trim().toLowerCase();
    let variants: string[];
    try {
      const parsed = JSON.parse(mystery.answer);
      variants = Array.isArray(parsed) ? (parsed as string[]) : [mystery.answer];
    } catch {
      variants = [mystery.answer];
    }
    const correct = variants.some(v => input === v.trim().toLowerCase());
    setAnswerState(correct ? 'correct' : 'wrong');
  }

  return (
    <>
      <View style={modalStyles.titleSection}>
        <Text style={modalStyles.volText}>Vol.{mystery.vol}</Text>
        <Text style={modalStyles.titleText}>{mystery.title}</Text>
      </View>

      {mystery.image_url ? (
        <View style={modalStyles.imageWrapper}>
          <Image
            source={{ uri: mystery.image_url }}
            style={modalStyles.mysteryImage}
            resizeMode="cover"
          />
        </View>
      ) : mystery.content ? (
        <Text style={modalStyles.contentText}>{mystery.content}</Text>
      ) : null}

      {mystery.hint ? (
        <HintAccordion
          hint={mystery.hint}
          open={hintOpen}
          onToggle={() => setHintOpen(v => !v)}
        />
      ) : null}

      {mystery.answer && answerState !== 'correct' ? (
        <View style={modalStyles.answerSection}>
          <View style={modalStyles.answerRow}>
            <TextInput
              style={modalStyles.answerInput}
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
              style={modalStyles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.submitButtonText}>送信</Text>
            </TouchableOpacity>
          </View>
          {answerState === 'wrong' && (
            <View style={modalStyles.wrongBanner}>
              <Text style={modalStyles.wrongIcon}>🤔</Text>
              <Text style={modalStyles.wrongText}>残念！ もう一回トライしてみるのじゃ</Text>
            </View>
          )}
        </View>
      ) : null}

      {answerState === 'correct' && (
        <LinearGradient
          colors={['#654cab', '#ea6025']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={modalStyles.correctBanner}
        >
          <View style={modalStyles.correctContent}>
            <SvgXml xml={lockOpenSvg} width={22} height={32} />
            <View>
              <Text style={modalStyles.correctTitle}>正解</Text>
              <Text style={modalStyles.correctSubtitle}>謎を解きあかした！</Text>
            </View>
          </View>
        </LinearGradient>
      )}
    </>
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
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.condensed,
    fontSize: 24,
    color: Colors.text,
    letterSpacing: 1,
    lineHeight: 32,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  cardWrapper: {
    position: 'relative',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#efefef',
    paddingHorizontal: 24,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  volText: {
    fontFamily: fonts.jpBold,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 16,
  },
  titleText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: Colors.text,
  },
  lockContainer: {
    alignItems: 'center',
    gap: 2,
  },
  lockIcon: {
    width: 40,
    height: 40,
  },
  decodeLabel: {
    fontFamily: fonts.condensed,
    fontSize: 10,
    color: Colors.error,
    letterSpacing: 0.5,
  },
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#f9f9f9',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 40,
  },
});

const modalStyles = StyleSheet.create({
  titleSection: {
    gap: 8,
  },
  volText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#222',
  },
  titleText: {
    fontFamily: fonts.jpBold,
    fontSize: 20,
    color: '#364153',
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
  contentText: {
    fontFamily: fonts.jpLight,
    fontSize: 14,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
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
    fontFamily: fonts.jpBlack,
    fontSize: 17,
    color: '#fff',
    fontWeight: '700',
  },
  correctSubtitle: {
    fontSize: 12,
    color: '#fff',
    lineHeight: 20,
  },
});
