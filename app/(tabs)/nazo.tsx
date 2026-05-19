import { fonts } from '@/lib/fonts';
import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getMysteries } from '@/lib/mysteries';
import { Mystery } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useUnread } from '@/lib/UnreadContext';
import ContentModal from '@/components/layout/ContentModal';
import Header from '@/components/layout/Header';
import NazoCard from '@/components/cards/NazoCard';
import NazoInputForm from '@/components/form/NazoInputForm';
import { HintAccordion } from '@/components/ui';

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
      <Header title="NAZO" showBack={false} />

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
                onPress={() => isPublished && setSelectedIndex(publishedIdx)}
                activeOpacity={isPublished ? 0.8 : 1}
              >
                <NazoCard
                  vol={`Vol.${item.vol}`}
                  title={item.title}
                  locked={!isPublished}
                />
              </TouchableOpacity>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>謎はまだありません</Text>
        }
      />

      <ContentModal
        visible={selectedIndex >= 0}
        onClose={handleClose}
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

      {mystery.answer && (
        <NazoInputForm
          value={answer}
          onChangeText={text => {
            setAnswer(text);
            if (answerState === 'wrong') setAnswerState('idle');
          }}
          onSubmit={handleSubmit}
          variant={answerState === 'correct' ? 'success' : answerState === 'wrong' ? 'failure' : 'default'}
        />
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
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  cardWrapper: {
    position: 'relative',
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
    ...fonts.jpRegular,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 40,
  },
});

const modalStyles = StyleSheet.create({
  titleSection: {
    gap: 8,
  },
  volText: {
    ...fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: '#222',
  },
  titleText: {
    ...fonts.jpBold,
    fontSize: 20,
    lineHeight: 28,
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
    ...fonts.jpLight,
    fontSize: 14,
    color: '#364153',
    lineHeight: 23,
  },
});
