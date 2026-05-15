import { Platform } from 'react-native';

export const fonts = {
  // Avenir Next Condensed 系（英字タイトル・見出し）
  condensed: Platform.select({
    ios: 'AvenirNextCondensed-Regular',
    android: 'Lato_400Regular',
    default: "'AvenirNextCondensed-Regular', 'Avenir Next Condensed', Lato, sans-serif",
  })!,
  condensedMedium: Platform.select({
    ios: 'AvenirNextCondensed-Medium',
    android: 'Lato_700Bold',
    default: "'AvenirNextCondensed-Medium', 'Avenir Next Condensed', Lato, sans-serif",
  })!,
  condensedBold: Platform.select({
    ios: 'AvenirNextCondensed-Bold',
    android: 'Lato_900Black',
    default: "'AvenirNextCondensed-Bold', 'Avenir Next Condensed', Lato, sans-serif",
  })!,

  // Avenir Next 系（英字本文）
  regular: Platform.select({
    ios: 'AvenirNext-Regular',
    android: 'Lato_400Regular',
    default: "'AvenirNext-Regular', 'Avenir Next', Lato, sans-serif",
  })!,
  medium: Platform.select({
    ios: 'AvenirNext-Medium',
    android: 'Lato_700Bold',
    default: "'AvenirNext-Medium', 'Avenir Next', Lato, sans-serif",
  })!,
  heavy: Platform.select({
    ios: 'AvenirNext-Heavy',
    android: 'Lato_900Black',
    default: "'AvenirNext-Heavy', 'Avenir Next', Lato, sans-serif",
  })!,

  // Noto Sans JP 系（日本語）
  jpLight: Platform.select({
    ios: 'NotoSansJP_300Light',
    android: 'NotoSansJP_300Light',
    default: "'Noto Sans JP', sans-serif",
  })!,
  jpRegular: Platform.select({
    ios: 'NotoSansJP_400Regular',
    android: 'NotoSansJP_400Regular',
    default: "'Noto Sans JP', sans-serif",
  })!,
  jpBold: Platform.select({
    ios: 'NotoSansJP_700Bold',
    android: 'NotoSansJP_700Bold',
    default: "'Noto Sans JP', sans-serif",
  })!,
  jpBlack: Platform.select({
    ios: 'NotoSansJP_900Black',
    android: 'NotoSansJP_900Black',
    default: "'Noto Sans JP', sans-serif",
  })!,
};
