# MCP Browser Notify

Firebase Cloud Messaging (FCM) を使用してユーザーにWebプッシュ通知を送信するMCPアプリです。

## 機能

- 🔔 **通知登録**: WebブラウザでFCMトークン取得とユーザー登録
- 📱 **マルチデバイス対応**: デスクトップ・モバイル両対応
- 👤 **ユーザー管理**: ユーザーIDベースの通知管理
- 🚀 **即座の通知送信**: 6つのMCPツール経由での通知送信
- 🗄️ **永続化**: Supabaseデータベースでの登録情報管理

## 前提条件

### Firebase プロジェクトの設定
1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Cloud Messaging を有効化
3. Webアプリを追加してFirebase設定を取得
4. サービスアカウントキーを生成

### Supabase データベースの設定
1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. 以下のテーブルを作成:

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  fcm_token TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile')) DEFAULT 'desktop',
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_fcm_token ON subscriptions(fcm_token);
```

## 環境変数

`.env` ファイルを作成:
```bash
# Firebase設定（必須）
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}

# Supabase設定（必須）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# オプション
PORT=3000
NGROK_DOMAIN=your-domain.ngrok-free.app
```

### フロントエンド設定
`public/config.js`にFirebaseプロジェクト設定とVAPIDキーを設定してください：

```javascript
window.AppConfig = {
    // Firebase設定 - Firebase Consoleから取得
    firebase: {
        apiKey: "YOUR_API_KEY",
        authDomain: "your-project.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project.appspot.com",
        messagingSenderId: "123456789012",
        appId: "1:123456789012:web:abcdef1234567890abcdef"
    },

    // FCM VAPID公開鍵 - Firebase Consoleから取得
    vapidKey: "YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE",

    // その他の設定は通常変更不要
    // ...
};
```

#### Firebase設定の取得方法：
1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクト設定 → 全般タブ
3. 「マイアプリ」セクションでWebアプリを選択
4. 「Firebase SDK snippet」→「構成」を選択
5. `firebaseConfig`オブジェクトの値を取得

#### VAPIDキーの取得方法：
1. Firebase Console で プロジェクト設定 → Cloud Messaging タブ
2. 「ウェブ構成」で新しいキーペアを生成または既存の「キーペア」をコピー
3. このキーを`config.js`の`vapidKey`に設定

**🎯 利点**: 
- 環境依存の設定が1箇所に集約
- `index.html`, `sw.js`, `app.js`が自動的に設定を読み込み
- 設定変更時の更新箇所が1ファイルのみ

## クイックスタート

### 方法A: 直接Node.js実行

1. 依存関係のインストール:
```bash
npm install
```

2. アプリケーションのビルド:
```bash
npm run build
```

3. 開発サーバー起動:
```bash
npm run dev
```

4. ブラウザで `http://localhost:3000` にアクセスして通知を登録

### 方法B: Docker使用

1. Docker Composeで起動:
```bash
docker-compose up -d
```

2. ブラウザで `http://localhost:3000` にアクセスして通知を登録

## MCPツール

このアプリは以下の6つのMCPツールを提供します:

### 通知送信ツール
- **`send_notification`**: 特定ユーザーに通知送信
  - パラメータ: `userId`, `message`, `title` (オプション)
- **`send_notification_to_all`**: 全登録ユーザーに一斉通知
  - パラメータ: `message`, `title` (オプション)

### ユーザー管理ツール
- **`register_user`**: FCMトークンでユーザー登録
  - パラメータ: `userId`, `fcmToken`, `deviceType`, `deviceInfo` (オプション)
- **`list_subscriptions`**: 登録済み通知の一覧表示（ユーザーフィルタ可）
  - パラメータ: `userId` (オプション)
- **`remove_subscription`**: 通知登録の削除
  - パラメータ: `subscriptionId`

### 統計ツール
- **`get_user_stats`**: ユーザーと登録統計の取得
  - 戻り値: ユーザー数、登録数、デバイス種別内訳

## 使用方法

1. WebページでユーザーIDを入力
2. 「通知を許可する」をクリック
3. ブラウザの通知許可ダイアログで「許可」を選択
4. FCMトークンが自動取得され、データベースに保存
5. MCPツールから通知送信可能

## 技術スタック

- **Backend**: Node.js + Express + TypeScript
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Database**: Supabase PostgreSQL
- **MCP Integration**: @modelcontextprotocol/sdk
- **Frontend**: Firebase SDK + Service Worker

## MCP設定

### Cursor IDE用 (.cursor/mcp.json)

#### 直接Node.js実行
```json
{
  "mcp": {
    "servers": {
      "browser-notify": {
        "command": "node",
        "args": ["dist/index.js"],
        "cwd": "/path/to/mcp-browser-notify",
        "env": {
          "FIREBASE_PROJECT_ID": "your-project-id",
          "FIREBASE_SERVICE_ACCOUNT_KEY": "{\"type\":\"service_account\",...}",
          "SUPABASE_URL": "https://your-project.supabase.co",
          "SUPABASE_ANON_KEY": "your-anon-key"
        }
      }
    }
  }
}
```

#### Docker使用
```json
{
  "mcp": {
    "servers": {
      "browser-notify": {
        "command": "docker",
        "args": ["exec", "browser-notify-container", "node", "dist/index.js"],
        "cwd": "/path/to/mcp-browser-notify"
      }
    }
  }
}
```

## ngrok連携

ngrok.ymlを編集してリモートアクセスを設定:

```yaml
version: 3

agent:
  authtoken: your_ngrok_authtoken
  connect_timeout: 30s

endpoints:
- name: notify
  url: https://your-domain.ngrok-free.app
  upstream:
    url: 3000
```

ngrokを起動:
```bash
ngrok start --config=./ngrok.yml notify
NGROK_DOMAIN=your-domain.ngrok-free.app npm run dev
```

## ヘルスモニタリング

アプリケーションの状態確認:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/admin/stats
```

## トラブルシューティング

### よくある問題

1. **Firebase認証エラー**
   - FIREBASE_SERVICE_ACCOUNT_KEYが有効なJSONか確認
   - Firebaseプロジェクトの権限を確認

2. **Supabase接続エラー**
   - SUPABASE_URLとSUPABASE_ANON_KEYを確認
   - データベーススキーマが作成されているか確認

3. **FCMトークンエラー**
   - フロントエンドのFirebaseプロジェクト設定を確認
   - Firebase ConsoleでWebアプリが正しく設定されているか確認

## セキュリティ注意事項

- サービスアカウントキーは安全に保管
- すべての認証情報は環境変数で管理
- 本番環境ではデータベースの行レベルセキュリティ(RLS)を推奨

## 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（ホットリロード）
npm run dev

# ビルド
npm run build

# 本番環境での実行
npm run start

# リント
npm run lint

# テスト実行
npm test
```

## プロジェクト構造

- `src/index.ts`: メインサーバーファイル（Express + MCP統合）
- `src/services/NotificationService.ts`: FCMベース通知管理クラス
- `src/mcp/MCPServer.ts`: MCPサーバーの実装
- `public/`: Webブラウザ用の静的ファイル
  - `index.html`: 通知登録用のWebページ
  - `app.js`: フロントエンドJavaScript
  - `sw.js`: Service Worker（Firebase Messaging用）

## ライセンス

MIT