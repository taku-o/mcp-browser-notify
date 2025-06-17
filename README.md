# MCP Browser Notify

WebプッシュNOTIFICATION方式でユーザーに通知を送信するMCPアプリです。

## 機能

- 🔔 **通知登録**: Webブラウザでプッシュ通知の許諾取得
- 📱 **マルチデバイス対応**: デスクトップ・モバイル両対応
- 🚀 **即座の通知送信**: MCPツール経由での通知送信
- 🛠️ **管理機能**: 登録・解除・一覧表示

## クイックスタート

1. 依存関係のインストール:
```bash
npm install
```

2. 開発サーバー起動:
```bash
npm run dev
```

3. ブラウザで `http://localhost:3000` にアクセスして通知を登録

## MCPツール

このアプリは以下の4つのMCPツールを提供します:

- `send_notification`: 特定の登録IDに通知送信
- `send_notification_to_all`: 全登録デバイスに一斉通知
- `list_subscriptions`: 登録済み通知の一覧表示
- `remove_subscription`: 通知登録の削除

## 使用方法

1. Webページで「通知を許可する」をクリック
2. ブラウザの通知許可ダイアログで「許可」を選択
3. 登録完了後、MCPツールから通知送信可能
4. テスト通知でも動作確認できます

## 技術スタック

- **Backend**: Node.js + Express + TypeScript
- **Push Notifications**: web-push (VAPID)
- **MCP Integration**: @modelcontextprotocol/sdk
- **Frontend**: Vanilla JavaScript + Service Worker

## 環境変数

```bash
# オプション: 既存のVAPIDキーを使用
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
PORT=3000
```

初回起動時にVAPIDキーが自動生成されます。