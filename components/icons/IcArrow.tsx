import { SvgXml } from 'react-native-svg';

export type ArrowDirection = 'down' | 'right' | 'left' | 'up';
type Props = { direction?: ArrowDirection; size?: number; color?: string };

const paths: Record<ArrowDirection, string> = {
  down: 'M15 5L8 12L1 5',
  right: 'M5 1L12 8L5 15',
  left: 'M11 15L4 8L11 1',
  up: 'M1 11L8 4L15 11',
};

const getSvg = (direction: ArrowDirection, color: string) =>
  `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="${paths[direction]}" stroke="${color}" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export default function IcArrow({ direction = 'right', size = 16, color = '#222222' }: Props) {
  return <SvgXml xml={getSvg(direction, color)} width={size} height={size} />;
}
