import {
  View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView,
} from 'react-native';
import { Colors } from '@/constants/colors';

const MUSIC_LINKS = [
  {
    platform: 'Spotify',
    emoji: '🎵',
    color: '#1db954',
    url: 'https://open.spotify.com',
    label: 'Spotifyで聴く',
  },
  {
    platform: 'Apple Music',
    emoji: '🎶',
    color: '#fc3c44',
    url: 'https://music.apple.com',
    label: 'Apple Musicで聴く',
  },
  {
    platform: 'YouTube Music',
    emoji: '▶️',
    color: '#ff0000',
    url: 'https://music.youtube.com',
    label: 'YouTubeで聴く',
  },
  {
    platform: 'LINE MUSIC',
    emoji: '🎤',
    color: '#00b900',
    url: 'https://music.line.me',
    label: 'LINE MUSICで聴く',
  },
];

export default function MusicScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>音楽</Text>
        <Text style={styles.subtitle}>Piercing Cycloneの楽曲を聴く</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>配信プラットフォーム</Text>
        {MUSIC_LINKS.map(link => (
          <TouchableOpacity
            key={link.platform}
            style={[styles.linkCard, { borderColor: link.color }]}
            onPress={() => Linking.openURL(link.url)}
          >
            <Text style={styles.linkEmoji}>{link.emoji}</Text>
            <View style={styles.linkInfo}>
              <Text style={styles.linkPlatform}>{link.platform}</Text>
              <Text style={styles.linkLabel}>{link.label}</Text>
            </View>
            <Text style={[styles.arrow, { color: link.color }]}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  section: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 14, color: Colors.textSecondary, fontWeight: '600',
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1,
  },
  linkCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1,
  },
  linkEmoji: { fontSize: 28, marginRight: 16 },
  linkInfo: { flex: 1 },
  linkPlatform: { fontSize: 16, fontWeight: '700', color: Colors.text },
  linkLabel: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  arrow: { fontSize: 18, fontWeight: 'bold' },
});
