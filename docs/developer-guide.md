# 開発者ガイド

このドキュメントは、MCP Browser Notify プロジェクトに参加する開発者向けのガイドです。

## プロジェクト概要

MCP Browser Notify は、Model Context Protocol (MCP) を使用してWebプッシュ通知を送信するアプリケーションです。AIアシスタント（Claude等）が処理完了時やユーザーの操作が必要な時にプッシュ通知を送信できるように設計されています。

### 主要な特徴

- **MCP統合**: 6つのMCPツールを提供してAIアシスタントとの連携
- **Webプッシュ通知**: Firebase Cloud Messaging (FCM) ベースの通知システム
- **マルチデバイス対応**: デスクトップ、モバイル両方で通知受信可能
- **永続化**: Supabase PostgreSQL による通知履歴とユーザー管理

## アーキテクチャ

### システム構成図

```
[AI Assistant (Claude)] 
        ↓ MCP Protocol
[MCP Server (Node.js)]
        ↓ Firebase Admin SDK
[Firebase Cloud Messaging]
        ↓ Web Push
[User Devices (Browser)]
```

### 技術スタック

#### バックエンド
- **Node.js + Express**: HTTP サーバー
- **TypeScript**: 型安全性の確保
- **Firebase Admin SDK**: FCM通知送信
- **Supabase Client**: データベース操作

#### フロントエンド
- **Firebase SDK**: FCMトークン取得
- **Service Worker**: プッシュ通知受信処理
- **Vanilla JavaScript**: 軽量な実装

#### データベース
- **Supabase PostgreSQL**: ユーザーデータと通知履歴

#### 通信プロトコル
- **MCP (Model Context Protocol)**: AIアシスタントとの通信
- **Web Push Protocol**: ブラウザへの通知配信

## プロジェクト構造

```
mcp-browser-notify/
├── src/                          # TypeScript ソースコード
│   ├── index.ts                  # メインサーバーファイル
│   ├── services/                 # サービスクラス
│   │   └── NotificationService.ts # 通知管理サービス
│   └── mcp/                      # MCP 関連
│       └── MCPServer.ts          # MCP サーバー実装
├── public/                       # 静的ファイル
│   ├── index.html               # 通知登録ページ
│   ├── app.js                   # フロントエンド JavaScript
│   └── sw.js                    # Service Worker
├── docs/                        # ドキュメント
├── rules/                       # 開発ルール
├── dist/                        # ビルド成果物
└── tests/                       # テストファイル
```

## MCP ツール仕様

本プロジェクトは以下の6つのMCPツールを提供します：

### 1. send_notification
個別ユーザーに通知を送信

**パラメータ:**
- `user_id` (string): 対象ユーザーID
- `title` (string): 通知タイトル
- `message` (string): 通知メッセージ

### 2. send_notification_to_all
全ユーザーに通知を送信

**パラメータ:**
- `title` (string): 通知タイトル
- `message` (string): 通知メッセージ

### 3. register_user
新規ユーザーの登録

**パラメータ:**
- `user_id` (string): ユーザーID
- `subscription` (object): プッシュ通知サブスクリプション情報

### 4. list_subscriptions
登録済みユーザー一覧の取得

**パラメータ:** なし

### 5. remove_subscription
ユーザーの登録解除

**パラメータ:**
- `user_id` (string): 対象ユーザーID

### 6. get_user_stats
ユーザー統計情報の取得

**パラメータ:** なし

## 開発フロー

### 1. 新機能開発

```bash
# 1. 作業ブランチを作成
git switch -c feature/new-feature

# 2. 開発作業
npm run dev

# 3. テスト実行
npm test

# 4. リント実行
npm run lint

# 5. コミット
git add .
git commit -m "Add new feature: description"
```

### 2. コードレビュー

- プルリクエスト作成前に必ずテストとリントを実行
- 機能変更時はドキュメントも更新
- セキュリティ関連の変更は特に慎重にレビュー

### 3. リリース

```bash
# 1. プロダクションビルド
npm run build

# 2. 本番環境でのテスト
npm run start

# 3. バージョンタグ作成
git tag v1.0.0
git push origin v1.0.0
```

## 開発規約

### コーディング規約

#### TypeScript
- strict モードを使用
- any 型の使用を避ける
- 適切な型定義を作成

#### ファイル命名
- PascalCase: クラスファイル (`NotificationService.ts`)
- camelCase: 一般的なファイル (`index.ts`)
- kebab-case: 設定ファイル (`docker-compose.yml`)

#### 関数・変数命名
- camelCase を使用
- 意味のある名前を付ける
- boolean 変数は `is`, `has`, `can` 等で始める

### エラーハンドリング

```typescript
// Good: 適切なエラーハンドリング
try {
  const result = await dangerousOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('Specific error message');
}

// Bad: エラーを無視
const result = await dangerousOperation().catch(() => null);
```

### セキュリティ

#### 環境変数
- 機密情報は必ず環境変数で管理
- `.env` ファイルは `.gitignore` に含める
- 本番環境では適切な権限設定

#### 入力検証
```typescript
// Good: 入力値検証
function sendNotification(userId: string, message: string) {
  if (!userId || userId.trim().length === 0) {
    throw new Error('User ID is required');
  }
  if (!message || message.length > 1000) {
    throw new Error('Invalid message');
  }
  // ...
}
```

## テスト

### テスト戦略

1. **単体テスト**: 各サービスクラスの個別テスト
2. **統合テスト**: MCP ツール間の連携テスト
3. **E2Eテスト**: 実際の通知送信フローのテスト

### テストの実行

```bash
# 全テスト実行
npm test

# カバレッジ取得
npm run test:coverage

# 特定のテストファイル実行
npm test -- --testNamePattern="NotificationService"
```

## デバッグ

### ログ出力

プロジェクトでは以下のログレベルを使用：

- `ERROR`: エラー情報
- `WARN`: 警告情報
- `INFO`: 一般的な情報
- `DEBUG`: デバッグ情報

### よくあるデバッグ方法

#### 1. FCM送信エラー
```bash
# Firebase Admin SDK のログを確認
DEBUG=firebase-admin:* npm run dev
```

#### 2. Service Worker エラー
```javascript
// ブラウザのデベロッパーツールで確認
console.log('Service Worker Status:', navigator.serviceWorker.controller);
```

#### 3. MCP通信エラー
```bash
# MCP通信をログ出力
DEBUG=mcp:* npm run dev
```

## パフォーマンス

### 最適化のポイント

1. **通知送信**: バッチ処理による効率化
2. **データベース**: 適切なインデックス設定
3. **メモリ使用量**: 不要なオブジェクトの解放

### モニタリング

- レスポンス時間の監視
- エラー率の監視
- データベース接続数の監視

## 本番運用

### 環境設定

```env
# 本番環境での推奨設定
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### スケーリング

- 水平スケーリング: 複数インスタンスでの運用
- ロードバランサー: リクエスト分散
- データベース: 読み書き分離

## 貢献方法

### 課題報告

1. GitHub Issues で課題を報告
2. 再現手順を詳細に記載
3. 環境情報（OS、Node.js バージョン等）を含める

### 機能提案

1. 機能の目的と必要性を説明
2. 実装方法の概要を提示
3. 既存機能への影響を考慮

### プルリクエスト

1. 適切なブランチ名を使用
2. 変更内容を詳細に説明
3. テストケースを追加
4. ドキュメントを更新

## 参考資料

- [MCP Specification](https://github.com/modelcontextprotocol/specification)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [Supabase Documentation](https://supabase.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## よくある質問 (FAQ)

### Q: 新しいMCPツールを追加したい
A: `src/mcp/MCPServer.ts` でツールを定義し、対応するサービスメソッドを実装してください。

### Q: 通知が届かない
A: Firebase設定、Service Worker登録、ブラウザの通知許可設定を確認してください。

### Q: データベースの移行方法は？
A: Supabase の Migration 機能を使用してスキーマ変更を管理してください。

### Q: 開発環境でHTTPS通信をテストしたい
A: ngrok を使用してローカル環境をHTTPS化できます。