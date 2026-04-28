import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDiary } from '@/lib/diaries';
import { Diary } from '@/lib/types';
import { Colors } from '@/constants/colors';

const AUTHOR_CONFIG = {
  wataru: { label: 'WATARU', color: '#3182ce', emoji: '🎸' },
  tamaru: { label: 'TAMARU', color: '#e94560', emoji: '🥁' },
};

export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDiary(id).then(data => {
      setDiary(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!diary) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>日記が見つかりません</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const config = AUTHOR_CONFIG[diary.author];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 戻る</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.authorBadge, { backgroundColor: config.color + '22', borderColor: config.color }]}>
          <Text style={styles.authorEmoji}>{config.emoji}</Text>
          <Text style={[styles.authorLabel, { color: config.color }]}>{config.label}</Text>
        </View>

        <Text style={styles.date}>
          {new Date(diary.created_at).toLocaleDateString('ja-JP', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
          })}
        </Text>

        <Text style={styles.contentText}>{diary.content}</Text>
      </ScrollView>
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
    backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  backText: { color: '#fff', fontSize: 16 },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { alignSelf: 'flex-start' },
  backBtnText: { color: Colors.primary, fontSize: 16 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  authorBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    marginBottom: 12,
  },
  authorEmoji: { fontSize: 18, marginRight: 8 },
  authorLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  date: { color: Colors.textSecondary, fontSize: 13, marginBottom: 20 },
  contentText: { color: Colors.text, fontSize: 16, lineHeight: 28 },
});
