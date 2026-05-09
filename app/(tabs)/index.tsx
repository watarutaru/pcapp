import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity, Image, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/profiles';
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
        getProfile(user.id),
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

  const memberId = profile.user_id.replace(/-/g, '').slice(0, 8).toUpperCase();

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
        <Text style={styles.memberNumber}>No. {memberId}</Text>
        <Image
          source={require('@/assets/images/bicycle.png')}
          style={styles.bicycleImage}
          resizeMode="contain"
        />
        <Text style={styles.nickname}>{profile.nickname}</Text>
      </View>

      {/* STAGE / QR タイル */}
      <View style={styles.tilesRow}>
        <View style={styles.infoTile}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>STAGE</Text>
            <Text style={styles.infoValue}>{profile.stage}</Text>
          </View>
          <View style={styles.tileDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>POINTS</Text>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsNumber}>{profile.total_points}</Text>
              <Text style={styles.pointsUnit}>pt</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.qrTile}
          onPress={() => router.push('/(tabs)/mypage' as any)}
          activeOpacity={0.8}
        >
          <SvgXml xml={qrSvg} width={24} height={24} />
          <Text style={styles.qrLabel}>チェックイン</Text>
        </TouchableOpacity>
      </View>

      {/* NEXT WAVE */}
      <View style={styles.nextWaveSection}>
        <Text style={styles.nextWaveHeader}>NEXT WAVE</Text>

        {nextLive ? (
          <TouchableOpacity
            style={styles.eventCard}
            onPress={() => router.push(`/live/${nextLive.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={styles.eventInfo}>
              <Text style={styles.eventDate}>
                {new Date(nextLive.date).toLocaleDateString('ja-JP', {
                  month: 'long', day: 'numeric', weekday: 'short',
                })}
              </Text>
              <Text style={styles.eventTitle} numberOfLines={2}>{nextLive.title}</Text>
              <Text style={styles.eventMeta}>
                {nextLive.venue}
                {'  '}
                {new Date(nextLive.date).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </Text>
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 32,
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
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  accountButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  memberNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    fontSize: 12,
    color: Colors.text,
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  bicycleImage: {
    width: '100%',
    aspectRatio: 350 / 168,
    marginBottom: 16,
  },
  nickname: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 32,
  },
  tilesRow: {
    marginHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  infoTile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#efefef',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontFamily: Platform.OS === 'ios' ? 'AvenirNextCondensed-Medium' : 'sans-serif-condensed',
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'sans-serif',
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  tileDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#efefef',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  pointsNumber: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'sans-serif',
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  pointsUnit: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  qrTile: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  qrLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    fontSize: 11,
    color: '#fff',
    letterSpacing: 0.3,
  },
  nextWaveSection: {
    marginHorizontal: 20,
  },
  nextWaveHeader: {
    fontFamily: Platform.OS === 'ios' ? 'AvenirNextCondensed-Medium' : 'sans-serif-condensed',
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    letterSpacing: 1,
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#efefef',
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 0,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  eventInfo: {
    flex: 1,
    gap: 4,
    paddingRight: 8,
  },
  eventDate: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 22,
  },
  eventMeta: {
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
