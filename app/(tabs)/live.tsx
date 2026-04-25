import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getLives, getUserCheckins } from '@/lib/lives';
import { supabase } from '@/lib/supabase';
import { Live } from '@/lib/types';
import { Colors } from '@/constants/colors';

export default function LiveScreen() {
  const router = useRouter();
  const [lives, setLives] = useState<Live[]>([]);
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
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
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

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
        <Text style={styles.title}>ライブ一覧</Text>
      </View>
      <FlatList
        data={lives}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.liveCard}
            onPress={() => router.push(`/live/${item.id}` as any)}
          >
            <View style={styles.dateContainer}>
              <Text style={styles.dateMonth}>
                {new Date(item.date).toLocaleDateString('ja-JP', { month: 'short' })}
              </Text>
              <Text style={styles.dateDay}>
                {new Date(item.date).getDate()}
              </Text>
            </View>
            <View style={styles.liveInfo}>
              <Text style={styles.liveTitle}>{item.title}</Text>
              <Text style={styles.liveVenue}>{item.venue}</Text>
              <Text style={styles.liveDate}>
                {new Date(item.date).toLocaleDateString('ja-JP', {
                  year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
                })}
              </Text>
            </View>
            {checkedInIds.has(item.id) && (
              <View style={styles.checkedBadge}>
                <Text style={styles.checkedText}>参戦済</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>ライブ情報はまだありません</Text>
        }
      />
    </View>
  );
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  liveCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateContainer: {
    width: 48,
    alignItems: 'center',
    marginRight: 16,
  },
  dateMonth: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    lineHeight: 32,
  },
  liveInfo: {
    flex: 1,
  },
  liveTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  liveVenue: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  liveDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  checkedBadge: {
    backgroundColor: Colors.success,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  checkedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: 40,
  },
});
