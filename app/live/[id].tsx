import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { getLive, getLives, getUserCheckins } from '@/lib/lives';
import { supabase } from '@/lib/supabase';
import { Live } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useUnread } from '@/lib/UnreadContext';

const closeSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6l12 12" stroke="#222222" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const chevronSvg = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 12L6 8L10 4" stroke="#222222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

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
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const { markRead } = useUnread();

  useFocusEffect(useCallback(() => {
    async function load() {
      const [liveData, allLives, { data: { user } }] = await Promise.all([
        getLive(id),
        getLives(),
        supabase.auth.getUser(),
      ]);
      setLive(liveData);
      const idx = allLives.findIndex(l => l.id === id);
      setPrevId(idx > 0 ? allLives[idx - 1].id : null);
      setNextId(idx >= 0 && idx < allLives.length - 1 ? allLives[idx + 1].id : null);
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
          <SvgXml xml={closeSvg} width={24} height={24} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.cardContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Dragged!バッジ（チェックイン済み） */}
          {isCheckedIn && (
            <LinearGradient
              colors={['#654cab', '#ea6025']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.draggedBadge}
            >
              <Text style={styles.draggedText}>Dragged!</Text>
            </LinearGradient>
          )}

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

      {/* 前後ナビ */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navBtn, !prevId && styles.navBtnDisabled]}
          onPress={() => prevId && router.replace(`/live/${prevId}` as any)}
          disabled={!prevId}
          activeOpacity={0.7}
        >
          <SvgXml xml={chevronSvg} width={16} height={16} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, !nextId && styles.navBtnDisabled]}
          onPress={() => nextId && router.replace(`/live/${nextId}` as any)}
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
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  draggedBadge: {
    alignSelf: 'flex-start',
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  draggedText: {
    fontFamily: Platform.OS === 'ios' ? 'AvenirNextCondensed-Bold' : 'sans-serif-condensed',
    fontSize: 10,
    color: '#fff',
    letterSpacing: 1,
    lineHeight: 16,
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
