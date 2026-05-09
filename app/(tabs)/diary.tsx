import { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getDiaries } from '@/lib/diaries';
import { Diary } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useState } from 'react';
import { useUnread } from '@/lib/UnreadContext';

const AUTHOR_CONFIG = {
  wataru: { label: 'WATARU', color: '#3182ce', emoji: '🎸' },
  tamaru: { label: 'TAMARU', color: '#e94560', emoji: '🥁' },
};

export default function DiaryScreen() {
  const router = useRouter();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { readIds, refresh: refreshUnread } = useUnread();

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>交換日記</Text>
        <Text style={styles.subtitle}>wataruとtamaruの日記</Text>
      </View>

      <FlatList
        data={diaries}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const config = AUTHOR_CONFIG[item.author];
          const preview = item.content.length > 80
            ? item.content.slice(0, 80) + '...'
            : item.content;

          return (
            <View style={styles.cardWrapper}>
              <TouchableOpacity
                style={styles.diaryCard}
                onPress={() => router.push(`/diary/${item.id}` as any)}
              >
                <View style={[styles.authorBadge, { backgroundColor: config.color + '22', borderColor: config.color }]}>
                  <Text style={styles.authorEmoji}>{config.emoji}</Text>
                  <Text style={[styles.authorLabel, { color: config.color }]}>{config.label}</Text>
                </View>
                <Text style={styles.preview}>{preview}</Text>
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString('ja-JP', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
              {!readIds.diary.has(item.id) && <View style={styles.unreadDot} />}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>日記はまだありません</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  list: { paddingHorizontal: 24, paddingBottom: 24 },
  cardWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  diaryCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
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
    borderColor: Colors.background,
  },
  authorBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 10,
  },
  authorEmoji: { fontSize: 14, marginRight: 6 },
  authorLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  preview: { color: Colors.text, fontSize: 14, lineHeight: 22, marginBottom: 10 },
  date: { color: Colors.textSecondary, fontSize: 12 },
  emptyText: {
    textAlign: 'center', color: Colors.textSecondary, fontSize: 16, marginTop: 40,
  },
});
