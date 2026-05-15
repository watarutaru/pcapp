import { View, Text, StyleSheet, ViewStyle } from 'react-native';
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
      {venue && <Text style={styles.text}>会場　{venue}</Text>}
      {time && <Text style={styles.text}>時間　{time}</Text>}
      {ticket && <Text style={styles.text}>チケット　{ticket}</Text>}
      {performers && <Text style={styles.text}>出演　{performers}</Text>}
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
    fontFamily: fonts.jpRegular,
    fontSize: 14,
    lineHeight: 22,
    color: '#222',
  },
});
