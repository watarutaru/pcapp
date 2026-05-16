import { Platform } from 'react-native';
import type { TextStyle } from 'react-native';

// フォールバック優先順位: Avenir Next > Lato > Noto Sans JP
// iOS   : Avenir Next（システムフォント）
// Android: Lato（ロード済み）
// Web   : CSS フォールバックスタック（Noto Sans JP で日本語をカバー）
//
// fontWeight を明示することで Web（Netlify）でも正しい太さで描画される

const WEB_STACK = "'Avenir Next', 'AvenirNext-Regular', Lato, 'Noto Sans JP', sans-serif";
const WEB_STACK_MED = "'Avenir Next', 'AvenirNext-Medium', Lato, 'Noto Sans JP', sans-serif";
const WEB_STACK_BOLD = "'Avenir Next', 'AvenirNext-Bold', Lato, 'Noto Sans JP', sans-serif";
const WEB_STACK_HEAVY = "'Avenir Next', 'AvenirNext-Heavy', Lato, 'Noto Sans JP', sans-serif";
const WEB_CONDENSED = "'Avenir Next Condensed', 'AvenirNextCondensed-Regular', Lato, 'Noto Sans JP', sans-serif";
const WEB_CONDENSED_MED = "'Avenir Next Condensed', 'AvenirNextCondensed-Medium', Lato, 'Noto Sans JP', sans-serif";
const WEB_CONDENSED_BOLD = "'Avenir Next Condensed', 'AvenirNextCondensed-Bold', Lato, 'Noto Sans JP', sans-serif";

type FontStyle = Pick<TextStyle, 'fontFamily' | 'fontWeight'>;

const ff = (
  ios: string,
  android: string,
  web: string,
  weight: TextStyle['fontWeight'],
): FontStyle => ({
  fontFamily: Platform.select({ ios, android, default: web })!,
  fontWeight: weight,
});

export const fonts = {
  // --- Avenir Next Condensed（見出し・タイトル）---
  condensed:       ff('AvenirNextCondensed-Regular', 'Lato_400Regular', WEB_CONDENSED,      '400'),
  condensedMedium: ff('AvenirNextCondensed-Medium',  'Lato_700Bold',    WEB_CONDENSED_MED,  '500'),
  condensedBold:   ff('AvenirNextCondensed-Bold',    'Lato_900Black',   WEB_CONDENSED_BOLD, '600'),

  // --- Avenir Next（本文・UI テキスト）---
  regular: ff('AvenirNext-Regular', 'Lato_400Regular', WEB_STACK,       '400'),
  medium:  ff('AvenirNext-Medium',  'Lato_700Bold',    WEB_STACK_MED,   '500'),
  heavy:   ff('AvenirNext-Heavy',   'Lato_900Black',   WEB_STACK_HEAVY, '800'),

  // --- jp* キー: 同一フォントスタックにエイリアス ---
  // Avenir Next / Lato が日本語文字のフォールバックをOS側で処理する。
  // Noto Sans JP との混在によるメトリクス差異を防ぐため統一している。
  jpLight:   ff('AvenirNext-Regular', 'Lato_300Light',   WEB_STACK,       '300'),
  jpRegular: ff('AvenirNext-Regular', 'Lato_400Regular', WEB_STACK,       '400'),
  jpBold:    ff('AvenirNext-Bold',    'Lato_700Bold',    WEB_STACK_BOLD,  '600'),
  jpBlack:   ff('AvenirNext-Heavy',   'Lato_900Black',   WEB_STACK_HEAVY, '900'),
};
