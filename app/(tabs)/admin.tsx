import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/profiles';
import Header from '@/components/layout/Header';
import { IcQR, IcCalendar, IcDiary, IcNazo, IcMusic, IcArrow } from '@/components/icons';
import { Colors } from '@/constants/colors';
import { fonts } from '@/lib/fonts';

const MENU_ITEMS = [
  {
    key: 'qr',
    label: 'QRチェックイン',
    sub: 'ライブ参加の記録・ポイント付与',
    Icon: IcQR,
    href: '/admin/qr',
  },
  {
    key: 'live',
    label: 'ライブ管理',
    sub: 'ライブ・イベント情報の登録・編集',
    Icon: IcCalendar,
    href: '/admin/live',
  },
  {
    key: 'diary',
    label: '日記管理',
    sub: 'WATARU / TAMARUの投稿',
    Icon: IcDiary,
    href: '/admin/diary',
  },
  {
    key: 'mystery',
    label: '謎管理',
    sub: '謎の作成・公開設定',
    Icon: IcNazo,
    href: '/admin/mystery',
  },
  {
    key: 'music',
    label: 'Music管理',
    sub: 'アルバム・シングルの登録',
    Icon: IcMusic,
    href: '/admin/music',
  },
] as const;

export default function AdminScreen() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setIsAdmin(false); return; }
      const profile = await getProfile(user.id);
      setIsAdmin(profile?.role === 'admin');
    });
  }, []);

  if (isAdmin === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!isAdmin) return null;

  return (
    <View style={styles.container}>
      <Header title="ADMIN" showBack={false} />
      <ScrollView contentContainerStyle={styles.list}>
        {MENU_ITEMS.map(({ key, label, sub, Icon, href }) => (
          <TouchableOpacity
            key={key}
            style={styles.item}
            onPress={() => router.push(href as any)}
            activeOpacity={0.7}
          >
            <View style={styles.itemIcon}>
              <Icon size={20} color={Colors.text} />
            </View>
            <View style={styles.itemText}>
              <Text style={styles.itemLabel}>{label}</Text>
              <Text style={styles.itemSub}>{sub}</Text>
            </View>
            <IcArrow direction="right" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: { flex: 1, gap: 2 },
  itemLabel: { ...fonts.jpBold, fontSize: 15, color: Colors.text },
  itemSub: { ...fonts.regular, fontSize: 12, color: Colors.textSecondary },
});
