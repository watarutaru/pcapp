import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { fonts } from '@/lib/fonts';
import { IcSetlist } from '@/components/icons';
import ContentHeading from '@/components/ui/ContentHeading';

type Props = {
  songs: string[];
  style?: ViewStyle;
};

export default function Setlist({ songs, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <ContentHeading label="SET LIST" icon={<IcSetlist size={24} color="#222" />} />
      <View>
        {songs.map((song, index) => (
          <Text key={index} style={styles.song}>
            {song}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 10,
  },
  song: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: '#364153',
  },
});
