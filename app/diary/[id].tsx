import { fonts } from '@/lib/fonts';
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { getDiary, getDiaries } from '@/lib/diaries';
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

const closeSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6l12 12" stroke="#222222" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const chevronSvg = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 12L6 8L10 4" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const AUTHOR_CONFIG = {
  wataru: {
    label: 'Wataru',
    avatar: require('@/assets/images/avatar-wataru.png'),
  },
  tamaru: {
    label: 'tmrr',
    avatar: require('@/assets/images/avatar-tamaru.png'),
  },
};

export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const { markRead } = useUnread();

  useEffect(() => {
    Promise.all([getDiary(id), getDiaries()]).then(([data, all]) => {
      setDiary(data);
      const idx = all.findIndex(d => d.id === id);
      setPrevId(idx > 0 ? all[idx - 1].id : null);
      setNextId(idx >= 0 && idx < all.length - 1 ? all[idx + 1].id : null);
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
          <SvgXml xml={closeSvg} width={24} height={24} />
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

      {/* 前後ナビ */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, !prevId && styles.navBtnDisabled]}
          onPress={() => prevId && router.replace(`/diary/${prevId}` as any)}
          disabled={!prevId}
          activeOpacity={0.7}
        >
          <SvgXml xml={chevronSvg} width={16} height={16} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, !nextId && styles.navBtnDisabled]}
          onPress={() => nextId && router.replace(`/diary/${nextId}` as any)}
          disabled={!nextId}
          activeOpacity={0.7}
        >
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <SvgXml xml={chevronSvg} width={16} height={16} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
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
    marginBottom: 24,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    ...fonts.regular,
    fontSize: 14,
    color: '#222',
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorName: {
    ...fonts.regular,
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
    ...fonts.jpLight,
    fontSize: 14,
    color: '#222',
    lineHeight: 23,
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
