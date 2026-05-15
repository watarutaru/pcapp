import { View, Text, Image, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { fonts } from '@/lib/fonts';
import { IcArrow } from '@/components/icons';

type Props = {
  title: string;
  type: string;
  albumArt?: ImageSourcePropType;
  style?: ViewStyle;
};

export default function MusicCard({ title, type, albumArt, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.albumArtWrapper}>
        {albumArt && <Image source={albumArt} style={styles.albumImage} />}
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.type}>{type}</Text>
      </View>
      <IcArrow direction="right" size={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efefef',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  albumArtWrapper: {
    width: 60,
    height: 60,
    borderWidth: 0.5,
    borderColor: '#efefef',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    flexShrink: 0,
  },
  albumImage: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
  },
  info: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#222',
  },
  type: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#898989',
  },
});
