# Piercing Cyclone 公式アプリ

Piercing Cyclone（バンド）のファン向け公式アプリ。React Native / Expo製。

## 技術スタック

- **フロントエンド**: React Native + Expo Router
- **バックエンド**: Supabase（認証・DB・RLS）
- **管理ツール**: Discordボット（`discord-bot/`）

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

### スマホでのプレビュー（Expo Go）

スマホとPCが**同じWi-Fi**にいる場合（推奨・安定）：
```bash
npx expo start
```

ネットワークが異なる場合（トンネル経由）：
```bash
npx expo start --tunnel
```
- 初回は `@expo/ngrok` のインストールを求められる → Yes
- Cloudflare トンネル URL（`exp://xxxx.trycloudflare.com`）が発行される
- スマホの **Expo Go** アプリでQRコードを読み込む
- トンネルが不安定な場合は `--clear` を追加して再起動：
  ```bash
  npx expo start --tunnel --clear
  ```

## DBスキーマ

`supabase-schema.sql` を Supabase SQL Editor で実行済み。テーブル構成：

- `profiles` - ユーザープロフィール・ポイント・ステージ
- `lives` - ライブ情報
- `checkins` - ライブチェックイン履歴
- `points` - ポイント付与履歴
- `diaries` - 交換日記（wataru / tamaru）
- `push_tokens` - プッシュ通知トークン

## Discordボット

`discord-bot/` に Node.js 製のボットがある。`discord-bot/.env.example` を参照して `.env` を作成し起動：

```bash
cd discord-bot
npm install
npm start
```

ボットが監視するチャンネル：
- `#live-info` → ライブ情報をDBに自動登録 + プッシュ通知送信
- `#diary-wataru` → wataruの日記をDBに登録 + プッシュ通知送信
- `#diary-tamaru` → tamaruの日記をDBに登録 + プッシュ通知送信
