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
