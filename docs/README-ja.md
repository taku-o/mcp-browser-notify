# MCP Browser Notify

Firebase Cloud Messaging (FCM) を使用してユーザーにWebプッシュ通知を送信するMCPアプリです。6つの強力なMCPツールによる通知管理と、iOS Safari PWA対応を含むマルチデバイスサポートを提供します。

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

### iOS Safari での使用方法

**iOS Safari（iOS 16.4以降）での要件:**
1. **PWAインストールが必須**: iOS SafariではPWA（Progressive Web App）としてインストールした場合のみWebプッシュ通知が動作します
2. **HTTPS接続が必要**: セキュア接続が必要（localhost除く）
3. **インストール手順**:
   - iOS SafariでWebサイトを開く
   - 「共有」ボタン（□↑）をタップ
   - 「ホーム画面に追加」を選択
   - ホーム画面のアイコンからアプリを起動
   - PWAモードで通知許可を求められた際に「許可」を選択

**重要な注意事項:**
- 通常のSafariブラウザではWebプッシュ通知は動作しません
- ホーム画面のアイコンから起動する必要があります（PWAモード）
- iOS 16.4以降が必要です
- アプリはiOS Safariを自動検出し、インストール手順を表示します

## 技術スタック

- **Backend**: Node.js + Express + TypeScript
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Database**: Supabase PostgreSQL
- **MCP Integration**: @modelcontextprotocol/sdk
- **Frontend**: Firebase SDK + Service Worker

## MCP設定

### Claude Code用

Claude Codeは`claude mcp add`コマンドを使用してMCPサーバーを登録します。以下の手順に従ってください：

#### 方法1: claude mcp addコマンド使用（推奨）
```bash
# 1. プロジェクトディレクトリに移動
cd /path/to/mcp-browser-notify

# 2. 環境変数を設定（または.envファイルを使用）
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com"}'
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# 3. プロジェクトをビルド
npm run build

# 4. Claude CodeにMCPサーバーを追加（MCP専用エントリーポイント使用）
claude mcp add browser-notify -- node /absolute/path/to/mcp-browser-notify/dist/mcp-only.js
```

#### 方法2: .envファイル使用（推奨）
```bash
# 1. 認証情報を含む.envファイルを作成
# 2. プロジェクトディレクトリに移動
cd /path/to/mcp-browser-notify

# 3. ビルドしてClaude Codeに追加（MCP専用エントリーポイント使用）
npm run build
claude mcp add browser-notify -- node $(pwd)/dist/mcp-only.js
```

#### 方法3: 直接実行
```bash
# 最初に環境変数を設定
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# MCPサーバーを直接実行
cd /path/to/mcp-browser-notify
npm run build
node dist/index.js
```

#### Claude Code用Docker
```bash
docker run -d \
  --name browser-notify-container \
  -e FIREBASE_PROJECT_ID="your-project-id" \
  -e FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}' \
  -e SUPABASE_URL="https://your-project.supabase.co" \
  -e SUPABASE_ANON_KEY="your-anon-key" \
  browser-notify

# DockerコンテナをClaude Codeに追加
claude mcp add browser-notify -- docker exec browser-notify-container node dist/mcp-only.js
```

### Cursor IDE用 (.cursor/mcp.json)

**Cursor使用時の重要な注意事項:**
- Cursorのmulti-root workspaceでは`cwd`パラメータが無視されます
- commandとargsには絶対パスを使用してください
- 環境変数のJSON文字列は適切にエスケープしてください

#### 直接Node.js実行（推奨）
```json
{
  "mcp": {
    "servers": {
      "browser-notify": {
        "command": "node",
        "args": ["/absolute/path/to/mcp-browser-notify/dist/index.js"],
        "env": {
          "FIREBASE_PROJECT_ID": "your-project-id",
          "FIREBASE_SERVICE_ACCOUNT_KEY": "{\"type\":\"service_account\",\"project_id\":\"your-project\",\"private_key\":\"-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n\",\"client_email\":\"firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com\"}",
          "SUPABASE_URL": "https://your-project.supabase.co",
          "SUPABASE_ANON_KEY": "your-anon-key"
        }
      }
    }
  }
}
```

#### 注意: MCPでの.envファイルの制限
**重要:** MCP環境では通常`.env`ファイルが自動読み込みされません。環境変数はmcp.json設定で明示的に定義する必要があります。プロジェクトには直接Node.js実行用のdotenvサポートが含まれていますが、MCPでは明示的な環境変数宣言が必要です。

#### Docker使用
```json
{
  "mcp": {
    "servers": {
      "browser-notify": {
        "command": "docker",
        "args": ["exec", "browser-notify-container", "node", "dist/index.js"]
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

4. **iOS Safari「サポートしていない端末」エラー**
   - iOS 16.4以降を使用しているか確認
   - PWAとしてインストール: Safari → 共有 → 「ホーム画面に追加」
   - Safariブラウザではなく、ホーム画面のアイコンから起動
   - PWAモードで通知許可を求められた際に「許可」を選択

5. **Firebase Service Account Key JSONパースエラー**
   - mcp.jsonでのJSONエスケープを確認: クォートは`\"`、改行は`\\n`
   - JSON文字列に制御文字が含まれていないか確認
   - mcp.jsonでのインライン指定ではなく.envファイル使用を検討
   - private_keyフィールドの改行文字が適切にエスケープされているか確認

6. **Cursor MCPパス解決問題**
   - mcp.jsonのargsでは絶対パスを使用: `/full/path/to/dist/index.js`
   - Cursorはmulti-root workspaceでcwdパラメータを無視します
   - MCP使用前にプロジェクトがビルドされているか確認: `npm run build`

7. **MCP環境変数が読み込まれない問題**
   - MCP環境では`.env`ファイルが自動的に読み込まれません
   - mcp.jsonですべての環境変数を明示的に定義する必要があります
   - FIREBASE_SERVICE_ACCOUNT_KEYが一行JSONとして適切にエスケープされているか確認
   - 必要な変数がすべて存在するか確認: FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT_KEY, SUPABASE_URL, SUPABASE_ANON_KEY

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