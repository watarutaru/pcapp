import { View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { fonts } from '@/lib/fonts';

type Props = {
  date: string;
  writer: string;
  preview: string;
  writerAvatar?: React.ReactNode;
  style?: ViewStyle;
};

export default function DiaryCard({ date, writer, preview, writerAvatar, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.date}>{date}</Text>
        <View style={styles.writerInfo}>
          <Text style={styles.writerName}>{writer}</Text>
          {writerAvatar ? (
            <View style={styles.avatar}>{writerAvatar}</View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{writer.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.preview}>{preview}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efefef',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    alignItems: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  date: {
    ...fonts.regular,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Regular',
      android: 'NotoSansMono_400Regular',
      default: "'Avenir Next', 'Noto Sans Mono', 'Noto Sans JP', sans-serif",
    }),
    fontSize: 14,
    lineHeight: 20,
    color: '#222',
  },
  writerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  writerName: {
    ...fonts.regular,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Regular',
      android: 'NotoSansMono_400Regular',
      default: "'Avenir Next', 'Noto Sans Mono', 'Noto Sans JP', sans-serif",
    }),
    fontSize: 14,
    lineHeight: 20,
    color: '#222',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  avatarInitial: {
    ...fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: '#222',
  },
  preview: {
    ...fonts.jpRegular,
    fontSize: 12,
    lineHeight: 18,
    color: '#222',
    width: '100%',
  },
});
