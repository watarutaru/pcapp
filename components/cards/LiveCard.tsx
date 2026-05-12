import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { fonts } from '@/lib/fonts';
import Tag from '@/components/ui/Tag';

export type LiveCardVariant = 'upcoming' | 'history';

type Props = {
  variant?: LiveCardVariant;
  title: string;
  date: string;
  venue: string;
  time?: string;
  tag?: string;
  style?: ViewStyle;
};

export default function LiveCard({
  variant = 'upcoming',
  title,
  date,
  venue,
  time,
  tag,
  style,
}: Props) {
  const isUpcoming = variant === 'upcoming';

  return (
    <View style={[styles.container, style]}>
      {tag && <Tag label={tag} variant={isUpcoming ? 'primary' : 'strong'} />}
      <View style={styles.info}>
        <View style={styles.titleSection}>
          <Text style={styles.date}>{date}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.detailSection}>
          <Text style={styles.detail}>{venue}</Text>
          {isUpcoming && time && <Text style={styles.detailEn}>{time}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efefef',
    borderRadius: 10,
    padding: 16,
    gap: 8,
  },
  info: {
    gap: 12,
    paddingRight: 60,
  },
  titleSection: {
    gap: 6,
  },
  detailSection: {
    gap: 6,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#222',
  },
  title: {
    fontFamily: fonts.jpBold,
    fontSize: 16,
    color: '#222',
  },
  detail: {
    fontFamily: fonts.jpRegular,
    fontSize: 11,
    color: '#222',
  },
  detailEn: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#222',
  },
});
