import { fonts } from '@/lib/fonts';
import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getDiaries } from '@/lib/diaries';
import { Diary } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useUnread } from '@/lib/UnreadContext';
import ContentModal from '@/components/layout/ContentModal';

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
  wataru: {
    label: 'Wataru',
    avatar: require('@/assets/images/avatar-wataru.png'),
  },
  tamaru: {
    label: 'tmrr',
    avatar: require('@/assets/images/avatar-tamaru.png'),
  },
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
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>JOURNAL</Text>
      </View>

      <FlatList
        data={diaries}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const config = AUTHOR_CONFIG[item.author];
          const isUnread = !readIds.diary.has(item.id);
          const preview = item.content.length > 60
            ? item.content.slice(0, 60) + '...'
            : item.content;

          return (
            <View style={styles.cardWrapper}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => setSelectedIndex(index)}
                activeOpacity={0.8}
              >
                {/* ヘッダー行：日付 + 著者名 + アバター */}
                <View style={styles.cardHeader}>
                  <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                  <View style={styles.authorRow}>
                    <Text style={styles.authorName}>{config.label}</Text>
                    <Image source={config.avatar} style={styles.avatar} />
                  </View>
                </View>

                {/* プレビューテキスト */}
                <Text style={styles.preview}>{preview}</Text>
              </TouchableOpacity>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>日記はまだありません</Text>
        }
      />

      {/* 詳細モーダル */}
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
  const config = AUTHOR_CONFIG[diary.author];
  return (
    <>
      <View style={modalStyles.metaRow}>
        <Text style={modalStyles.dateText}>{formatDate(diary.created_at)}</Text>
        <View style={modalStyles.authorGroup}>
          <Text style={modalStyles.authorName}>{config.label}</Text>
          <Image source={config.avatar} style={modalStyles.avatar} />
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
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dateText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.text,
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  authorName: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.text,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  preview: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  contentText: {
    fontFamily: fonts.jpLight,
    fontSize: 14,
    color: '#222',
    lineHeight: 23,
  },
});
