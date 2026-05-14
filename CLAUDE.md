# Piercing Cyclone 公式アプリ

Piercing Cyclone（バンド）のファン向け公式アプリ。React Native / Expo製。

## コーディング方針

### 共通コンポーネントの使用（必須）

画面実装時は、既存の共通コンポーネントを必ず使用すること。独自に同等のスタイルを再実装してはいけない。

| 用途 | コンポーネント |
|---|---|
| ボタン | `components/ui/Button.tsx`（variant: `primary` / `secondary` / `white`） |
| フォーム入力 | `components/form/Form.tsx`（variant: `regular` / `password` / `error`） |
| アイコン | `components/icons/`（`IcHelp`, `IcClose`, `IcArrow` など） |
| レイアウト | `components/layout/`（`Header`, `BottomNav` など） |
| カード | `components/cards/` |
| UI部品 | `components/ui/`（`ButtonText`, `ContentHeading`, `Tab`, `Tag` など） |

---

## 技術スタック

- **フロントエンド**: React Native + Expo Router
- **バックエンド**: Supabase（認証・DB・RLS）
- **Webプレビュー**: Netlify（`expo export --platform web` でビルド・デプロイ）

## ディレクトリ構成

```
app/
  (auth)/          # 認証画面（ログイン・登録・パスワードリセット）
  (tabs)/          # メインタブ画面（index/diary/live/music/nazo/mypage）
  admin/           # 管理画面（live/music/mystery/nazo/qr）
  component-library.tsx  # UIコンポーネント一覧（開発用プレビュー）
components/
  ui/              # 汎用UIパーツ（Button, Tag, Tab, HintAccordion 等）
  cards/           # カードコンポーネント（DiaryCard, LiveCard, MusicCard 等）
  form/            # フォームコンポーネント（Form, NazoInputForm）
  layout/          # レイアウト（Header, BottomNav 等）
  home/            # ホーム専用ブロック（CheckinBlock, StatusBlock）
  icons/           # SVGアイコン一式（IcHome, IcMusic 等）
lib/               # Supabase APIラッパー・型定義
gas/               # Google Apps Script（手動での会員管理用）
```

## デザインコンポーネント

`components/` 配下にアプリ全体で共通利用するUIコンポーネントが揃っている。
**新しい画面や機能を実装する際は、必ず既存コンポーネントを優先して使うこと。**

- カードUI → `components/cards/`
- ボタン・タグ・タブ・アコーディオン等 → `components/ui/`
- フォーム → `components/form/`
- アイコン → `components/icons/`（SVGベース、`IcXxx` 命名）

コンポーネントの一覧と見た目は `app/component-library.tsx` で確認できる。
開発時は管理画面（Admin タブ）→「コンポーネントライブラリ」から参照可能。

## 環境変数

プロジェクトルートに `.env` を作成（`.env.example` を参照）：

```
EXPO_PUBLIC_SUPABASE_URL=https://ehhxerotomgufljnxcuf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=（Supabase ダッシュボード → Settings → API → anon key）
```

## 開発・動作確認

### 依存関係インストール
```bash
npm install
```

> **注意**: プロジェクトパスに `:` が含まれるため `npx expo` は動作しない。
> 必ず `node_modules/.bin/expo` を直接呼び出すこと。

### スマホでのプレビュー（Expo Go）

> **注意**: LAN直接接続は動作しない。必ず以下のCloudflareトンネル方式を使うこと。
> ngrok（`--tunnel`オプション）は不安定なため使用しない。

**3つのターミナルを順番に起動する：**

**Terminal 1 — Metro:**
```bash
node_modules/.bin/expo start --clear
```

**Terminal 2 — プロキシ:**
```bash
node expo-proxy.js
```

**Terminal 3 — Cloudflareトンネル:**
```bash
cloudflared tunnel --url http://localhost:8090
```

トンネルURLが発行されたら（例: `https://xxxx.trycloudflare.com`）、
Expo Goアプリで以下のURLを手動入力：
```
exp://xxxx.trycloudflare.com
```

### WebプレビューはNetlifyで確認

Webビルド（`expo export --platform web`）はNetlifyに自動デプロイされる。
ブラウザで動作確認したい場合はNetlifyのプレビューURLを使うこと。

## DBスキーマ

`supabase-schema.sql` および `supabase-music-schema.sql` を Supabase SQL Editor で実行済み。テーブル構成：

- `profiles` - ユーザープロフィール・ポイント・ステージ
- `lives` - ライブ情報
- `checkins` - ライブチェックイン履歴
- `points` - ポイント付与履歴
- `diaries` - 交換日記（wataru / tamaru）
- `push_tokens` - プッシュ通知トークン
- `music` - 音楽（アルバム・シングル等）情報（`supabase-music-schema.sql`）
- `mysteries` / 謎解き関連 - 謎・ヒント・解答履歴（`lib/mysteries.ts` 参照）
