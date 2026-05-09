import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getMysteries } from '@/lib/mysteries';
import { Mystery } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useUnread } from '@/lib/UnreadContext';

export default function NazoScreen() {
  const router = useRouter();
  const [mysteries, setMysteries] = useState<Mystery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { readIds, refresh: refreshUnread } = useUnread();

  const load = useCallback(async () => {
    const data = await getMysteries();
    setMysteries(data);
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

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>NAZO</Text>
      </View>

      <FlatList
        data={mysteries}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isUnread = !readIds.mystery.has(item.id);
          return (
            <View style={styles.cardWrapper}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => item.is_published && router.push(`/nazo/${item.id}` as any)}
                activeOpacity={item.is_published ? 0.8 : 1}
              >
                <View style={styles.cardInfo}>
                  <Text style={styles.volText}>Vol.{item.vol}</Text>
                  <Text style={styles.titleText}>{item.title}</Text>
                </View>
                <Image
                  source={
                    item.is_published
                      ? require('@/assets/images/lock-open.png')
                      : require('@/assets/images/lock-closed.png')
                  }
                  style={styles.lockIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              {item.is_published && isUnread && <View style={styles.unreadDot} />}
            </View>
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
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'AvenirNextCondensed-Regular' : 'sans-serif-condensed',
    fontSize: 24,
    color: Colors.text,
    letterSpacing: 1,
    lineHeight: 32,
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
    paddingHorizontal: 24,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  volText: {
    fontFamily: Platform.OS === 'ios' ? 'HiraginoSans-W6' : 'sans-serif-medium',
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 16,
  },
  titleText: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    fontSize: 12,
    color: Colors.text,
  },
  lockIcon: {
    width: 48,
    height: 48,
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
    borderColor: '#f5f5f5',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 40,
  },
});
