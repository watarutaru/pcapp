import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { getProfile, getPointHistory } from '@/lib/profiles';
import { signOut } from '@/lib/auth';
import { Profile, Point, Stage } from '@/lib/types';
import { Colors } from '@/constants/colors';

const STAGE_LABELS: Record<Stage, string> = {
  ROOKIE: '🌱 ROOKIE',
  FAN: '⭐ FAN',
  SUPPORTER: '🌟 SUPPORTER',
  CYCLONER: '💫 CYCLONER',
  LEGEND: '🌀 LEGEND',
};

export default function MyPageScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [p, ph] = await Promise.all([
        getProfile(user.id),
        getPointHistory(user.id),
      ]);
      setProfile(p);
      setPoints(ph);
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

  async function handleSignOut() {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>マイページ</Text>
      </View>

      {profile && (
        <View style={styles.profileCard}>
          <View style={styles.profileCardHeader}>
            <Text style={styles.nickname}>{profile.nickname}</Text>
            <Text style={styles.stageBadge}>
              {STAGE_LABELS[profile.stage as Stage]}
            </Text>
          </View>
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
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ポイント履歴</Text>
        {points.length === 0 ? (
          <Text style={styles.emptyText}>ポイント履歴はありません</Text>
        ) : (
          points.map(p => (
            <View key={p.id} style={styles.pointRow}>
              <View style={styles.pointInfo}>
                <Text style={styles.pointReason}>{p.reason}</Text>
                <Text style={styles.pointDate}>
                  {new Date(p.created_at).toLocaleDateString('ja-JP')}
                </Text>
              </View>
              <Text style={styles.pointAmount}>+{p.amount}pt</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>ログアウト</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  profileCard: {
    marginHorizontal: 24, backgroundColor: Colors.surface, borderRadius: 16,
    padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.border,
  },
  profileCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  nickname: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  stageBadge: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  section: { paddingHorizontal: 24, marginBottom: 20 },
  sectionTitle: {
    fontSize: 13, color: Colors.textSecondary, fontWeight: '600',
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1,
  },
  actionButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.primary,
  },
  actionEmoji: { fontSize: 24, marginRight: 12 },
  actionLabel: { flex: 1, color: Colors.text, fontSize: 16, fontWeight: '600' },
  actionArrow: { color: Colors.primary, fontSize: 18, fontWeight: 'bold' },
  pointRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  pointInfo: { flex: 1 },
  pointReason: { color: Colors.text, fontSize: 14 },
  pointDate: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  pointAmount: { color: Colors.success, fontSize: 16, fontWeight: '700' },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  signOutButton: {
    borderWidth: 1, borderColor: Colors.error, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  signOutText: { color: Colors.error, fontSize: 16, fontWeight: '600' },
});
