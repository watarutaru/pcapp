import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { getLive, getUserCheckins } from '@/lib/lives';
import { supabase } from '@/lib/supabase';
import { Live } from '@/lib/types';
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

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `開演 ${h}:${min}`;
}

export default function LiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [live, setLive] = useState<Live | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const { markRead } = useUnread();

  useFocusEffect(useCallback(() => {
    async function load() {
      const [liveData, { data: { user } }] = await Promise.all([
        getLive(id),
        supabase.auth.getUser(),
      ]);
      setLive(liveData);
      if (user) {
        const checkins = await getUserCheckins(user.id);
        setIsCheckedIn(checkins.some(c => c.live_id === id));
      }
      setLoading(false);
      markRead('live', id);
    }
    load();
  }, [id, markRead]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!live) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>ライブ情報が見つかりません</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LIVE</Text>
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
          {/* 日付・タイトル */}
          <View style={styles.titleSection}>
            <Text style={styles.dateText}>{formatDate(live.date)}</Text>
            <Text style={styles.titleText}>{live.title}</Text>
          </View>

          {/* 情報ボックス */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLine}>会場　{live.venue}</Text>
            <Text style={styles.infoLine}>時間　{formatTime(live.date)}</Text>
            {live.description ? (
              <Text style={styles.infoLine}>{live.description}</Text>
            ) : null}
          </View>

          {/* チェックインボタン */}
          <View style={styles.checkinSection}>
            {isCheckedIn ? (
              <View style={styles.checkedButton}>
                <Text style={styles.checkedButtonText}>参戦済み</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.checkinButton}
                onPress={() => router.push('/qr-checkin' as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.checkinButtonText}>このライブにチェックインする</Text>
              </TouchableOpacity>
            )}
          </View>
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
    backgroundColor: Colors.surface,
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
  titleSection: {
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: Colors.text,
  },
  titleText: {
    fontFamily: Platform.OS === 'ios' ? 'HiraginoSans-W6' : 'sans-serif-medium',
    fontSize: 20,
    fontWeight: '500',
    color: '#0a0a0a',
    lineHeight: 28,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: Colors.text,
    borderRadius: 4,
    padding: 24,
    gap: 10,
  },
  infoLine: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  checkinSection: {
    paddingTop: 16,
  },
  checkinButton: {
    backgroundColor: Colors.primary,
    borderRadius: 60,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  checkedButton: {
    backgroundColor: Colors.success,
    borderRadius: 60,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
