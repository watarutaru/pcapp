import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { fonts } from '@/lib/fonts';
import { IcLock } from '@/components/icons';

type Props = {
  vol: string;
  title: string;
  locked?: boolean;
  style?: ViewStyle;
};

export default function NazoCard({ vol, title, locked = true, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.info}>
        <Text style={styles.vol}>{vol}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <IcLock variant={locked ? 'gray' : 'gradient'} size={48} />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  vol: {
    ...fonts.medium,
    fontSize: 16,
    color: '#222',
  },
  title: {
    ...fonts.regular,
    fontSize: 12,
    color: '#222',
  },
});
