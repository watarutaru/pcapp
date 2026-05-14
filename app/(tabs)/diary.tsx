import { fonts } from '@/lib/fonts';
import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getDiaries } from '@/lib/diaries';
import { Diary } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useUnread } from '@/lib/UnreadContext';
import ContentModal from '@/components/layout/ContentModal';
import Header from '@/components/layout/Header';
import DiaryCard from '@/components/cards/DiaryCard';
import { IcWriterWataru, IcWriterTmrr } from '@/components/icons';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const wd = WEEKDAYS[d.getDay()];
  return `${y}.${m}.${day} (${wd})`;
}

const AUTHOR_CONFIG = {
  wataru: { label: 'Wataru', Icon: IcWriterWataru },
  tamaru: { label: 'tmrr', Icon: IcWriterTmrr },
} as const;

export default function DiaryScreen() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const { readIds, refresh: refreshUnread, markRead } = useUnread();

  const load = useCallback(async () => {
    const data = await getDiaries();
    setDiaries(data);
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

  const selectedDiary = selectedIndex >= 0 ? diaries[selectedIndex] : null;

  useEffect(() => {
    if (selectedDiary) {
      markRead('diary', selectedDiary.id);
    }
  }, [selectedDiary?.id]);

  const handleClose = () => setSelectedIndex(-1);
  const handlePrev = () => setSelectedIndex(i => Math.max(0, i - 1));
  const handleNext = () => setSelectedIndex(i => Math.min(diaries.length - 1, i + 1));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="JOURNAL" showBack={false} />

      <FlatList
        data={diaries}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const { label, Icon } = AUTHOR_CONFIG[item.author];
          const isUnread = !readIds.diary.has(item.id);
          const preview = item.content.length > 60
            ? item.content.slice(0, 60) + '...'
            : item.content;

          return (
            <View style={styles.cardWrapper}>
              <TouchableOpacity onPress={() => setSelectedIndex(index)} activeOpacity={0.8}>
                <DiaryCard
                  date={formatDate(item.created_at)}
                  writer={label}
                  preview={preview}
                  writerAvatar={<Icon size={48} />}
                />
              </TouchableOpacity>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>日記はまだありません</Text>
        }
      />

      <ContentModal
        visible={selectedIndex >= 0}
        onClose={handleClose}
        title="JOURNAL"
        hasPrev={selectedIndex > 0}
        hasNext={selectedIndex < diaries.length - 1}
        onPrev={handlePrev}
        onNext={handleNext}
      >
        {selectedDiary && (
          <DiaryModalContent diary={selectedDiary} />
        )}
      </ContentModal>
    </View>
  );
}

function DiaryModalContent({ diary }: { diary: Diary }) {
  const { label, Icon } = AUTHOR_CONFIG[diary.author];
  return (
    <>
      <View style={modalStyles.metaRow}>
        <Text style={modalStyles.dateText}>{formatDate(diary.created_at)}</Text>
        <View style={modalStyles.authorGroup}>
          <Text style={modalStyles.authorName}>{label}</Text>
          <Icon size={48} />
        </View>
      </View>
      <Text style={modalStyles.contentText}>{diary.content}</Text>
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
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 40,
  },
});

const modalStyles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#222',
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorName: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#0a0a0a',
    lineHeight: 28,
  },
  contentText: {
    fontFamily: fonts.jpLight,
    fontSize: 14,
    color: '#222',
    lineHeight: 23,
  },
});
