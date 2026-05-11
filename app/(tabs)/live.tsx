import { fonts } from '@/lib/fonts';
import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getLives, getUserCheckins } from '@/lib/lives';
import { supabase } from '@/lib/supabase';
import { Live } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useUnread } from '@/lib/UnreadContext';

type Tab = 'UPCOMING' | 'HISTORY';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const wd = WEEKDAYS[d.getDay()];
  return `${y}.${m}.${day} (${wd})`;
}

function formatTime(dateStr: string, openTime?: string) {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const start = `開演 ${h}:${min}`;
  return openTime ? `開場 ${openTime} / ${start}` : start;
}

export default function LiveScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('UPCOMING');
  const [lives, setLives] = useState<Live[]>([]);
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { readIds, refresh: refreshUnread } = useUnread();

  const load = useCallback(async () => {
    const [livesData, { data: { user } }] = await Promise.all([
      getLives(),
      supabase.auth.getUser(),
    ]);
    setLives(livesData);
    if (user) {
      const checkins = await getUserCheckins(user.id);
      setCheckedInIds(new Set(checkins.map(c => c.live_id)));
    }
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

  const now = new Date();
  const filteredLives = lives.filter(l =>
    tab === 'UPCOMING'
      ? new Date(l.date) >= now
      : new Date(l.date) < now
  );

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>LIVE</Text>
      </View>

      {/* タブ */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'UPCOMING' && styles.tabActive]}
          onPress={() => setTab('UPCOMING')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'UPCOMING' && styles.tabTextActive]}>UPCOMING</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'HISTORY' && styles.tabActive]}
          onPress={() => setTab('HISTORY')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, tab === 'HISTORY' && styles.tabTextActive]}>HISTORY</Text>
        </TouchableOpacity>
      </View>

      {/* リスト */}
      <FlatList
        data={filteredLives}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isCheckedIn = checkedInIds.has(item.id);
          const isUnread = !readIds.live.has(item.id);
          return (
            <View style={styles.cardWrapper}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/live/${item.id}` as any)}
                activeOpacity={0.8}
              >
                {isCheckedIn && (
                  <LinearGradient
                    colors={['#654cab', '#ea6025']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.statusBadge}
                  >
                    <Text style={styles.statusText}>Dragged!</Text>
                  </LinearGradient>
                )}
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                    <Text style={styles.titleText} numberOfLines={2}>{item.title}</Text>
                  </View>
                  <View style={styles.cardMeta}>
                    <Text style={styles.venueText}>{item.venue}</Text>
                    <Text style={styles.timeText}>{formatTime(item.date, item.open_time)}</Text>
                  </View>
                </View>
                <View style={styles.illustContainer} pointerEvents="none">
                  <Image
                    source={require('@/assets/images/live-illust.png')}
                    style={styles.illust}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {tab === 'UPCOMING' ? '予定はありません' : '過去のライブはありません'}
          </Text>
        }
      />
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  tab: {
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    borderRadius: 60,
    paddingVertical: 7,
    paddingHorizontal: 12,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontFamily: fonts.condensedMedium,
    fontSize: 16,
    color: Colors.text,
    letterSpacing: 1,
    lineHeight: 16,
  },
  tabTextActive: {
    color: '#fff',
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
    padding: 16,
    gap: 10,
    overflow: 'hidden',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  statusText: {
    fontFamily: fonts.condensedBold,
    fontSize: 10,
    color: '#fff',
    letterSpacing: 1,
    lineHeight: 16,
  },
  cardContent: {
    gap: 12,
    paddingRight: 60,
  },
  cardTop: {
    gap: 6,
  },
  dateText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 14,
  },
  titleText: {
    fontFamily: fonts.jpBold,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 22,
  },
  cardMeta: {
    gap: 6,
  },
  venueText: {
    fontFamily: fonts.jpLight,
    fontSize: 11,
    color: Colors.text,
    lineHeight: 11,
  },
  timeText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: Colors.text,
    lineHeight: 11,
  },
  illustContainer: {
    position: 'absolute',
    right: -28,
    top: 0,
    bottom: 0,
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illust: {
    width: 91,
    height: 107,
    transform: [{ rotate: '-19deg' }],
    opacity: 0.85,
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
