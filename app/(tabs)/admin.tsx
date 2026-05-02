import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

const MENU_ITEMS = [
  { icon: '📷', label: 'QRチェックイン', sub: '会員QRを読み取ってチェックイン', route: '/admin/qr' },
  { icon: '🎸', label: 'ライブ管理', sub: '追加・削除', route: '/admin/live' },
  { icon: '📖', label: '日記管理', sub: '追加・削除', route: '/admin/diary' },
  { icon: '🔐', label: 'PC謎管理', sub: '追加・削除', route: '/admin/nazo' },
];

export default function AdminScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>管理メニュー</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {MENU_ITEMS.map(item => (
          <TouchableOpacity
            key={item.route}
            style={styles.card}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.cardText}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.sub}>{item.sub}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  icon: { fontSize: 28, marginRight: 16 },
  cardText: { flex: 1 },
  label: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  sub: { fontSize: 13, color: Colors.textSecondary },
  arrow: { fontSize: 24, color: Colors.textSecondary },
});
