import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getPcNazos, getNazoResult } from '@/lib/pc-nazo';
import { supabase } from '@/lib/supabase';
import { PcNazo } from '@/lib/types';
import { Colors } from '@/constants/colors';

export default function NazoScreen() {
  const router = useRouter();
  const [nazos, setNazos] = useState<PcNazo[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [nazosData, { data: { user } }] = await Promise.all([
      getPcNazos(),
      supabase.auth.getUser(),
    ]);
    setNazos(nazosData);
    if (user) {
      const solved = new Set<string>();
      await Promise.all(
        nazosData.map(async (n) => {
          const result = await getNazoResult(user.id, n.id);
          if (result) solved.add(n.id);
        })
      );
      setSolvedIds(solved);
    }
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
        <Text style={styles.title}>PC謎</Text>
        <Text style={styles.subtitle}>Piercing Cycloneの謎解き</Text>
      </View>
      <FlatList
        data={nazos}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const solved = solvedIds.has(item.id);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/nazo/${item.id}` as any)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardIcon}>{solved ? '✅' : '🔐'}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardDate}>
                    {new Date(item.date).toLocaleDateString('ja-JP', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </Text>
                  {solved && (
                    <View style={styles.solvedBadge}>
                      <Text style={styles.solvedText}>正解済み</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>謎はまだありません</Text>
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
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
  },
  cardIcon: { fontSize: 24, marginRight: 12 },
  cardMeta: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardDate: { color: Colors.textSecondary, fontSize: 12 },
  solvedBadge: {
    backgroundColor: Colors.success, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  solvedText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 6,
  },
  cardBody: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
  emptyText: {
    textAlign: 'center', color: Colors.textSecondary, fontSize: 16, marginTop: 40,
  },
});
