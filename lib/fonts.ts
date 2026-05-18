import { Platform } from 'react-native';
import type { TextStyle } from 'react-native';

// フォールバック優先順位: Avenir Next Condensed > Noto Sans Mono > Noto Sans JP
// iOS   : Avenir Next Condensed（システムフォント）
// Android: Noto Sans Mono（ロード済み）
// Web   : Avenir Next Condensed（macOS）> Noto Sans Mono（Google Fonts）> フォールバック
//
// fontWeight を明示することで Web（Netlify）でも正しい太さで描画される

const WEB_STACK = "'Avenir Next Condensed', 'Noto Sans Mono', 'Noto Sans JP', sans-serif";
const WEB_STACK_MED = "'Avenir Next Condensed', 'Noto Sans Mono', 'Noto Sans JP', sans-serif";
const WEB_STACK_BOLD = "'Avenir Next Condensed', 'Noto Sans Mono', 'Noto Sans JP', sans-serif";
const WEB_STACK_HEAVY = "'Avenir Next Condensed', 'Noto Sans Mono', 'Noto Sans JP', sans-serif";
const WEB_CONDENSED = "'Avenir Next Condensed', 'Noto Sans Mono', 'Noto Sans JP', sans-serif";
const WEB_CONDENSED_MED = "'Avenir Next Condensed', 'Noto Sans Mono', 'Noto Sans JP', sans-serif";
const WEB_CONDENSED_BOLD = "'Avenir Next Condensed', 'Noto Sans Mono', 'Noto Sans JP', sans-serif";

type FontStyle = Pick<TextStyle, 'fontFamily' | 'fontWeight' | 'letterSpacing'>;

const ff = (
  ios: string,
  android: string,
  web: string,
  weight: TextStyle['fontWeight'],
  letterSpacing: number = 0,
): FontStyle => ({
  fontFamily: Platform.select({ ios, android, default: web })!,
  fontWeight: weight,
  letterSpacing,
});

export const fonts = {
  // --- Avenir Next Condensed（見出し・タイトル）---
  condensed:       ff('AvenirNextCondensed-Regular', 'NotoSansMono_400Regular', WEB_CONDENSED,      '400'),
  condensedMedium: ff('AvenirNextCondensed-Medium',  'NotoSansMono_700Bold',    WEB_CONDENSED_MED,  '500'),
  condensedBold:   ff('AvenirNextCondensed-Bold',    'NotoSansMono_900Black',   WEB_CONDENSED_BOLD, '600'),

  // --- Avenir Next Condensed（本文・UI テキスト）---
  regular: ff('AvenirNextCondensed-Regular', 'NotoSansMono_400Regular', WEB_STACK,       '400'),
  medium:  ff('AvenirNextCondensed-Medium',  'NotoSansMono_700Bold',    WEB_STACK_MED,   '500'),
  heavy:   ff('AvenirNextCondensed-Heavy',   'NotoSansMono_900Black',   WEB_STACK_HEAVY, '800'),

  // --- jp* キー: 同一フォントスタックにエイリアス ---
  // Avenir Next Condensed / Noto Sans Mono が日本語文字のフォールバックをOS側で処理する。
  // Noto Sans JP との混在によるメトリクス差異を防ぐため統一している。
  jpLight:   ff('AvenirNextCondensed-Regular', 'NotoSansMono_300Light',   WEB_STACK,       '300'),
  jpRegular: ff('AvenirNextCondensed-Regular', 'NotoSansMono_400Regular', WEB_STACK,       '400'),
  jpBold:    ff('AvenirNextCondensed-Bold',    'NotoSansMono_700Bold',    WEB_STACK_BOLD,  '600'),
  jpBlack:   ff('AvenirNextCondensed-Heavy',   'NotoSansMono_900Black',   WEB_STACK_HEAVY, '900'),
};
