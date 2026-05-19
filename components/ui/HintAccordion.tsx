import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { fonts } from '@/lib/fonts';
import { IcHint, IcArrow } from '@/components/icons';
import ContentHeading from '@/components/ui/ContentHeading';

type Props = {
  hint?: string;
  open?: boolean;
  onToggle?: () => void;
  style?: ViewStyle;
};

export default function HintAccordion({ hint, open = false, onToggle, style }: Props) {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <ContentHeading
          label="HINT"
          icon={<IcHint size={24} color="#222" />}
          style={styles.heading}
        />
        <IcArrow direction={open ? 'up' : 'down'} size={16} />
      </View>
      {open && hint && <Text style={styles.hintText}>{hint}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    flex: 1,
  },
  hintText: {
    ...fonts.jpRegular,
    fontSize: 12,
    lineHeight: 18,
    color: '#222',
  },
});
