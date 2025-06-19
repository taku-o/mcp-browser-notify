# Mac環境での開発セットアップ手順

この文書では、macOSで MCP Browser Notify プロジェクトの開発環境をセットアップする手順を説明します。

## 前提条件

### 1. 必要なソフトウェア

以下のソフトウェアがインストールされている必要があります：

#### Node.js (推奨: v18以上)
```bash
# Homebrewを使用してインストール
brew install node

# バージョン確認
node --version
npm --version
```

#### Git
```bash
# Homebrewを使用してインストール（通常はmacOSに標準インストール済み）
brew install git

# バージョン確認
git --version
```

#### エディタ (推奨: VS Code)
```bash
# Homebrewを使用してインストール
brew install --cask visual-studio-code
```

### 2. 外部サービスアカウント

以下のサービスアカウントを事前に作成してください：

- **Firebase プロジェクト**: https://console.firebase.google.com/
- **Supabase プロジェクト**: https://supabase.com/

## プロジェクトのセットアップ

### 1. プロジェクトのクローン

```bash
# プロジェクトをクローン
git clone <repository-url>
cd mcp-browser-notify

# 依存関係をインストール
npm install
```

### 2. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成します：

```bash
# .envファイルを作成
cp .env.example .env
# または
touch .env
```

`.env` ファイルに以下の内容を設定してください：

```env
# Firebase設定（必須）
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}

# Supabase設定（必須）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# オプション設定
PORT=3000
NGROK_DOMAIN=your-domain.ngrok-free.app
```

#### Firebase設定の取得方法

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択または新規作成
3. 「プロジェクトの設定」→「サービスアカウント」
4. 「新しい秘密鍵の生成」をクリック
5. ダウンロードしたJSONファイルの内容を `FIREBASE_SERVICE_ACCOUNT_KEY` に設定

#### Supabase設定の取得方法

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択または新規作成
3. 「Settings」→「API」
4. Project URL を `SUPABASE_URL` に設定
5. anon public key を `SUPABASE_ANON_KEY` に設定

### 3. データベースのセットアップ

Supabaseでテーブルを作成します：

```sql
-- subscriptions テーブル
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT,
  auth TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_token ON subscriptions(token);
```

## 開発の開始

### 1. 開発サーバーの起動

```bash
# 開発サーバーをホットリロードで起動
npm run dev
```

サーバーが起動したら、以下のURLでアクセスできます：
- アプリケーション: http://localhost:3000
- 通知登録ページ: http://localhost:3000/

### 2. ビルドとテスト

```bash
# プロダクションビルド
npm run build

# 本番環境での実行
npm run start

# リント実行
npm run lint

# テスト実行
npm test
```

## MCP クライアントとの接続

### Claude Desktop での設定

Claude Desktop の設定ファイル (`~/Library/Application Support/Claude/claude_desktop_config.json`) に以下を追加：

```json
{
  "mcpServers": {
    "browser-notify": {
      "command": "node",
      "args": ["path/to/mcp-browser-notify/dist/index.js"],
      "env": {
        "FIREBASE_PROJECT_ID": "your-project-id",
        "FIREBASE_SERVICE_ACCOUNT_KEY": "{...}",
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. ポート番号が使用中
```bash
# 使用中のポート確認
lsof -ti:3000

# プロセスを停止
kill -9 $(lsof -ti:3000)

# または別のポートを使用
PORT=3001 npm run dev
```

#### 2. Firebase認証エラー
- `FIREBASE_SERVICE_ACCOUNT_KEY` の JSON形式が正しいか確認
- プロジェクトIDが正しいか確認
- Firebase プロジェクトで Cloud Messaging API が有効になっているか確認

#### 3. Supabase接続エラー
- `SUPABASE_URL` と `SUPABASE_ANON_KEY` が正しいか確認
- Supabase プロジェクトが一時停止されていないか確認

#### 4. npm install でエラー
```bash
# npmキャッシュをクリア
npm cache clean --force

# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 5. Service Worker が動作しない
- HTTPS または localhost でのみ動作することを確認
- ブラウザの開発者ツールでエラーを確認
- Service Worker の登録状態を確認

## 開発のベストプラクティス

### 1. Git ワークフロー
```bash
# 新しい機能開発時
git switch -c feature/new-feature
# 開発作業...
git add .
git commit -m "Add new feature"
```

### 2. コードの品質管理
```bash
# コミット前に必ず実行
npm run lint
npm test
npm run build
```

### 3. 環境変数の管理
- `.env` ファイルは `.gitignore` に含める
- 機密情報は環境変数経由で管理
- 本番環境では適切な権限管理を実施

## 参考リンク

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Supabase Documentation](https://supabase.io/docs)
- [MCP (Model Context Protocol)](https://github.com/modelcontextprotocol)
- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)