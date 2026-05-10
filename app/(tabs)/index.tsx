import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity, Image, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { supabase } from '@/lib/supabase';
import { getOrCreateProfile } from '@/lib/profiles';
import { getNextLive } from '@/lib/lives';
import { Profile, Live } from '@/lib/types';
import { Colors } from '@/constants/colors';

const personSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="8" r="4" stroke="#222222" stroke-width="1.5"/>
  <path d="M4 20c0-3.866 3.582-7 8-7s8 3.134 8 7" stroke="#222222" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const qrSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="white" stroke-width="1.5"/>
  <rect x="5.5" y="5.5" width="3" height="3" fill="white"/>
  <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="white" stroke-width="1.5"/>
  <rect x="15.5" y="5.5" width="3" height="3" fill="white"/>
  <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="white" stroke-width="1.5"/>
  <rect x="5.5" y="15.5" width="3" height="3" fill="white"/>
  <rect x="13" y="13" width="3.5" height="3.5" fill="white"/>
  <rect x="18" y="13" width="3" height="3.5" fill="white"/>
  <rect x="13" y="18" width="3.5" height="3" fill="white"/>
  <rect x="18" y="18" width="3" height="3" fill="white"/>
</svg>`;

const bicycleNavSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="5.5" cy="16" r="3.5" stroke="#222222" stroke-width="1.5"/>
  <circle cx="18.5" cy="16" r="3.5" stroke="#222222" stroke-width="1.5"/>
  <path d="M5.5 16L9.5 9H14.5L18.5 16" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9.5 9L12 16" stroke="#222222" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M13 7H16" stroke="#222222" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M14.5 7V9" stroke="#222222" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${year}.${month}.${day} (${weekdays[d.getDay()]})`;
}

function formatEventTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `開演 ${h}:${m}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nextLive, setNextLive] = useState<Live | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [p, live] = await Promise.all([
        getOrCreateProfile(user.id, user.email ?? ''),
        getNextLive(),
      ]);
      setProfile(p);
      setNextLive(live);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>プロフィールが見つかりません</Text>
      </View>
    );
  }

  const memberId = profile.member_number ?? profile.user_id.replace(/-/g, '').slice(0, 11).toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.accountButton}
          onPress={() => router.push('/(tabs)/mypage' as any)}
          activeOpacity={0.7}
        >
          <SvgXml xml={personSvg} width={20} height={20} />
        </TouchableOpacity>
      </View>

      {/* 会員カード */}
      <View style={styles.memberCard}>
        <View style={styles.memberCardTop}>
          <Text style={styles.memberNumber}>{memberId}</Text>
          <Text style={styles.nickname}>{profile.nickname}</Text>
        </View>
        <Image
          source={require('@/assets/images/bicycle.png')}
          style={styles.bicycleImage}
          resizeMode="contain"
        />
      </View>

      {/* STAGE / QR タイル */}
      <View style={styles.tilesRow}>
        <View style={styles.infoTile}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>STAGE</Text>
            <Text style={styles.infoValue}>{profile.stage}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>POINTS</Text>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsNumber}>{profile.total_points}</Text>
              <Text style={styles.pointsUnit}> pt</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.qrTile}
          onPress={() => router.push('/(tabs)/mypage' as any)}
          activeOpacity={0.8}
        >
          <SvgXml xml={qrSvg} width={36} height={36} />
          <Text style={styles.qrLabel}>チェックイン</Text>
        </TouchableOpacity>
      </View>

      {/* NEXT WAVE */}
      <View style={styles.nextWaveSection}>
        <View style={styles.nextWaveHeaderRow}>
          <SvgXml xml={bicycleNavSvg} width={24} height={24} />
          <Text style={styles.nextWaveTitle}>NEXT WAVE</Text>
        </View>

        {nextLive ? (
          <TouchableOpacity
            style={styles.eventCard}
            onPress={() => router.push(`/live/${nextLive.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={styles.eventInfo}>
              <Text style={styles.eventDate}>{formatEventDate(nextLive.date)}</Text>
              <Text style={styles.eventTitle} numberOfLines={2}>{nextLive.title}</Text>
              <Text style={styles.eventVenue}>{nextLive.venue}</Text>
              <Text style={styles.eventTime}>{formatEventTime(nextLive.date)}</Text>
            </View>
            <View style={styles.illustContainer}>
              <Image
                source={require('@/assets/images/live-illust.png')}
                style={styles.liveIllust}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>直近の予定はありません</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  content: {
    paddingBottom: 32,
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
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  accountButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCard: {
    marginHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  memberCardTop: {
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  memberNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    fontSize: 12,
    color: Colors.text,
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  nickname: {
    fontFamily: Platform.OS === 'ios' ? 'HiraginoSans-W6' : 'sans-serif-medium',
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 32,
  },
  bicycleImage: {
    width: '100%',
    aspectRatio: 350 / 168,
  },
  tilesRow: {
    marginHorizontal: 24,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  infoTile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#efefef',
    minHeight: 80,
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontFamily: Platform.OS === 'ios' ? 'AvenirNextCondensed-Regular' : 'sans-serif-condensed',
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 1,
    lineHeight: 16,
  },
  infoValue: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pointsNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif',
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.36,
  },
  pointsUnit: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  qrTile: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  qrLabel: {
    fontFamily: Platform.OS === 'ios' ? 'HiraginoSans-W3' : 'sans-serif',
    fontSize: 11,
    color: '#fff',
  },
  nextWaveSection: {
    marginHorizontal: 24,
    gap: 8,
  },
  nextWaveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 30,
  },
  nextWaveTitle: {
    fontFamily: Platform.OS === 'ios' ? 'AvenirNextCondensed-Medium' : 'sans-serif-condensed',
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    letterSpacing: 1,
    lineHeight: 18,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#efefef',
    padding: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  eventInfo: {
    flex: 1,
    gap: 6,
    paddingRight: 8,
  },
  eventDate: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    fontSize: 14,
    color: Colors.text,
  },
  eventTitle: {
    fontFamily: Platform.OS === 'ios' ? 'HiraginoSans-W5' : 'sans-serif-medium',
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  eventVenue: {
    fontFamily: Platform.OS === 'ios' ? 'HiraginoSans-W3' : 'sans-serif',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  eventTime: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  illustContainer: {
    width: 90,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  liveIllust: {
    width: 91,
    height: 107,
    transform: [{ rotate: '-19deg' }],
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#efefef',
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
