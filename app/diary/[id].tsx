import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Image, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDiary } from '@/lib/diaries';
import { Diary } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useUnread } from '@/lib/UnreadContext';

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
    label: 'Tamaru',
    avatar: require('@/assets/images/avatar-tamaru.png'),
  },
};

export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const { markRead } = useUnread();

  useEffect(() => {
    getDiary(id).then(data => {
      setDiary(data);
      setLoading(false);
    });
    markRead('diary', id);
  }, [id, markRead]);

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
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const config = AUTHOR_CONFIG[diary.author];

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>JOURNAL</Text>
      </View>

      {/* コンテンツカード */}
      <View style={styles.card}>
        {/* 閉じるボタン */}
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.cardContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 日付・著者行 */}
          <View style={styles.metaRow}>
            <Text style={styles.dateText}>{formatDate(diary.created_at)}</Text>
            <View style={styles.authorGroup}>
              <Text style={styles.authorName}>{config.label}</Text>
              <Image source={config.avatar} style={styles.avatar} />
            </View>
          </View>

          {/* 本文 */}
          <Text style={styles.contentText}>{diary.content}</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
    fontFamily: Platform.OS === 'ios' ? 'AvenirNextCondensed-Regular' : 'sans-serif-condensed',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#efefef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.text,
    lineHeight: 20,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    fontSize: 16,
    color: '#222',
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorName: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
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
    fontFamily: Platform.OS === 'ios' ? 'HiraginoSans-W3' : 'sans-serif-light',
    fontSize: 14,
    color: '#364153',
    lineHeight: 23,
  },
});
