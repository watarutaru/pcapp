import { View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { fonts } from '@/lib/fonts';

type Props = {
  venue?: string;
  time?: string;
  ticket?: string;
  performers?: string;
  style?: ViewStyle;
};

export default function LiveInformation({ venue, time, ticket, performers, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {venue && <Text style={styles.text}><Text style={styles.label}>会場</Text>　{venue}</Text>}
      {time && <Text style={styles.text}><Text style={styles.label}>時間</Text>　{time}</Text>}
      {ticket && <Text style={styles.text}><Text style={styles.label}>チケット</Text>　{ticket}</Text>}
      {performers && <Text style={styles.text}><Text style={styles.label}>出演</Text>　{performers}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 4,
    padding: 24,
    gap: 6,
  },
  text: {
    ...fonts.jpRegular,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Regular',
      android: 'NotoSansMono_400Regular',
      default: "'Avenir Next', 'Noto Sans Mono', 'Noto Sans JP', sans-serif",
    }),
    fontSize: 14,
    lineHeight: 22,
    color: '#222',
  },
  label: {
    ...fonts.jpBold,
  },
});
