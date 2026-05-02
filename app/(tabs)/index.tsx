import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/profiles';
import { getNextLive } from '@/lib/lives';
import { Profile, STAGE_THRESHOLDS, Stage, Live, LiveCategory } from '@/lib/types';
import { Colors } from '@/constants/colors';

const STAGE_LABELS: Record<Stage, string> = {
  ROOKIE: '🌱 ROOKIE',
  FAN: '⭐ FAN',
  SUPPORTER: '🌟 SUPPORTER',
  CYCLONER: '💫 CYCLONER',
  LEGEND: '🌀 LEGEND',
};

const STAGE_COLORS: Record<Stage, string> = {
  ROOKIE: '#718096',
  FAN: '#d69e2e',
  SUPPORTER: '#3182ce',
  CYCLONER: '#805ad5',
  LEGEND: '#e94560',
};

const CATEGORY_ICON: Record<LiveCategory, string> = {
  'ライブ': '🎸',
  '配信': '📡',
  'イベント': '🎪',
  'グッズ': '👕',
};

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

  const stage = profile.stage as Stage;
  const stageColor = STAGE_COLORS[stage];
  const nextStagePoints = getNextStagePoints(profile.total_points);
  const progress = getProgress(profile.total_points);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.appTitle}>Piercing Cyclone</Text>
        <Text style={styles.memberLabel}>会員証</Text>
      </View>

      {/* 会員カード */}
      <View style={[styles.card, { borderColor: stageColor }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.nickname}>{profile.nickname}</Text>
          <Text style={[styles.stageBadge, { color: stageColor }]}>
            {STAGE_LABELS[stage]}
          </Text>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.total_points}</Text>
            <Text style={styles.statLabel}>ポイント</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.visit_count}</Text>
            <Text style={styles.statLabel}>参戦回数</Text>
          </View>
        </View>

        {nextStagePoints !== null && (
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              次のステージまで {nextStagePoints - profile.total_points}pt
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: stageColor }]} />
            </View>
          </View>
        )}

        <View style={styles.qrSection}>
          <QRCode
            value={profile.user_id}
            size={160}
            color={Colors.text}
            backgroundColor={Colors.surface}
          />
          <Text style={styles.memberId}>
            Member #{String(profile.user_id).slice(0, 8).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* 直近スケジュール */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>直近の予定</Text>
      </View>

      {nextLive ? (
        <TouchableOpacity
          style={styles.liveCard}
          onPress={() => router.push(`/live/${nextLive.id}` as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.categoryIcon}>
            {CATEGORY_ICON[nextLive.category] ?? '📅'}
          </Text>
          <View style={styles.liveInfo}>
            <View style={styles.liveTitleRow}>
              <Text style={styles.categoryLabel}>{nextLive.category}</Text>
              <Text style={styles.liveTitle}>{nextLive.title}</Text>
            </View>
            <Text style={styles.liveDate}>
              {new Date(nextLive.date).toLocaleDateString('ja-JP', {
                year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
              })}
              {' '}
              {new Date(nextLive.date).toLocaleTimeString('ja-JP', {
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
            <Text style={styles.liveVenue}>{nextLive.venue}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyLive}>
          <Text style={styles.emptyLiveText}>予定はありません</Text>
        </View>
      )}
    </ScrollView>
  );
}

function getNextStagePoints(points: number): number | null {
  const thresholds = Object.values(STAGE_THRESHOLDS).sort((a, b) => a - b);
  for (const t of thresholds) {
    if (t > points) return t;
  }
  return null;
}

function getProgress(points: number): number {
  const thresholds = Object.values(STAGE_THRESHOLDS).sort((a, b) => a - b);
  let prev = 0;
  for (const t of thresholds) {
    if (t > points) {
      return Math.round(((points - prev) / (t - prev)) * 100);
    }
    prev = t;
  }
  return 100;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 1,
  },
  memberLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  card: {
    marginHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  nickname: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  stageBadge: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  qrSection: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  memberId: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: 12,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  liveCard: {
    marginHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  liveInfo: {
    flex: 1,
  },
  liveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  liveTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  liveDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  liveVenue: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  emptyLive: {
    marginHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyLiveText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
