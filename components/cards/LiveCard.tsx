import { View, Text, Image, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { fonts } from '@/lib/fonts';
import Tag from '@/components/ui/Tag';

export type LiveCardVariant = 'upcoming' | 'history';

type Props = {
  variant?: LiveCardVariant;
  title: string;
  date: string;
  venue: string;
  time?: string;
  openTime?: string;
  tag?: string;
  illustration?: ImageSourcePropType;
  style?: ViewStyle;
};

export default function LiveCard({
  variant = 'upcoming',
  title,
  date,
  venue,
  time,
  openTime,
  tag,
  illustration,
  style,
}: Props) {
  const isUpcoming = variant === 'upcoming';

  const timeText =
    openTime && time
      ? `${openTime} / ${time}`
      : time ?? openTime ?? null;

  return (
    <View style={[styles.container, style]}>
      {tag && <Tag label={tag} variant={isUpcoming ? 'primary' : 'strong'} />}
      <View style={styles.body}>
        <View style={[styles.info, illustration ? styles.infoWithIllust : undefined]}>
          <View style={styles.titleSection}>
            <Text style={styles.date}>{date}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.detailSection}>
            <Text style={styles.detail}>{venue}</Text>
            {isUpcoming && timeText && <Text style={styles.detailEn}>{timeText}</Text>}
          </View>
        </View>
        {illustration && (
          <View style={styles.illustContainer}>
            <Image
              source={illustration}
              style={styles.illust}
              resizeMode="contain"
            />
          </View>
        )}
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
    overflow: 'hidden',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  info: {
    flex: 1,
    gap: 12,
  },
  infoWithIllust: {
    paddingRight: 8,
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
    fontFamily: fonts.medium,
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
  illustContainer: {
    width: 90,
    height: 90,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  illust: {
    width: 91,
    height: 107,
    transform: [{ rotate: '-19deg' }],
  },
});
