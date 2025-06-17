# MCP Browser Notify

WebプッシュNOTIFICATION方式でユーザーに通知を送信するMCPアプリです。

## 機能

- 🔔 **通知登録**: Webブラウザでプッシュ通知の許諾取得
- 📱 **マルチデバイス対応**: デスクトップ・モバイル両対応
- 🚀 **即座の通知送信**: MCPツール経由での通知送信
- 🛠️ **管理機能**: 登録・解除・一覧表示

## クイックスタート

以下のいずれかの方法を選択してください:

### 方法A: 直接Node.js実行

1. 依存関係のインストール:
```bash
npm install
```

2. 開発サーバー起動:
```bash
npm run dev
```

3. ブラウザで `http://localhost:3000` にアクセスして通知を登録

### 方法B: Docker使用

1. Docker Composeで起動:
```bash
docker-compose up -d
```

2. ブラウザで `http://localhost:3000` にアクセスして通知を登録

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

## ngrok連携

### 方法1: ngrok.yml使用（推奨）

1. プロジェクトルートの`ngrok.yml`を編集:
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

2. 設定ファイルでngrokを起動:
```bash
ngrok start --config=/path/to/mcp-browser-notify/ngrok.yml notify
```

3. 環境変数を設定:
```bash
NGROK_DOMAIN=your-domain.ngrok-free.app npm run dev
```

### 方法2: 直接コマンド

1. ngrokアカウントとドメインを設定
2. `NGROK_DOMAIN`環境変数を設定
3. ngrokを起動: `ngrok http --domain=your-domain.ngrok.io 3000`
4. アプリケーションが自動的にngrok URLを使用

## Dockerサポート

### Docker Compose使用（推奨）

1. コンテナをビルドして起動:
```bash
docker-compose up -d
```

2. ログを確認:
```bash
docker-compose logs -f browser-notify
```

3. コンテナを停止:
```bash
docker-compose down
```

### Docker直接使用

1. イメージをビルド:
```bash
docker build -t browser-notify .
```

2. コンテナを実行:
```bash
docker run -d \
  --name browser-notify-container \
  -p 3000:3000 \
  -e NODE_ENV=production \
  browser-notify
```

3. 停止と削除:
```bash
docker stop browser-notify-container
docker rm browser-notify-container
```

### 環境変数付きDocker実行

```bash
docker run -d \
  --name browser-notify-container \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e VAPID_PUBLIC_KEY=your_public_key \
  -e VAPID_PRIVATE_KEY=your_private_key \
  -e NGROK_DOMAIN=your-domain.ngrok-free.app \
  browser-notify
```

## 完全セットアップガイド

### オプション1: 直接Node.js実行

#### ステップ1: ngrok.ymlを編集
プロジェクトルートの`ngrok.yml`を編集:
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

#### ステップ2: ngrokを起動
```bash
ngrok start --config=/path/to/mcp-browser-notify/ngrok.yml notify
```

#### ステップ3: Node.jsサーバーを起動
```bash
NGROK_DOMAIN=your-domain.ngrok-free.app npm run dev
```

#### ステップ4: MCPを設定
`.cursor/mcp.json`を作成:
```json
{
  "mcp": {
    "servers": {
      "browser-notify": {
        "command": "node",
        "args": ["dist/index.js"],
        "cwd": "/path/to/mcp-browser-notify"
      }
    }
  }
}
```

### オプション2: Docker使用

#### ステップ1: ngrok.ymlを編集
プロジェクトルートの`ngrok.yml`を編集:
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

#### ステップ2: ngrokを起動
```bash
ngrok start --config=/path/to/mcp-browser-notify/ngrok.yml notify
```

#### ステップ3: Dockerコンテナを起動
```bash
docker-compose up -d
```

#### ステップ4: Docker用MCPを設定
`.cursor/mcp.json`を作成:
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