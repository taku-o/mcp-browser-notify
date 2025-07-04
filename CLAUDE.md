# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

このプロジェクトは、WebプッシュNOTIFICATION方式でユーザーに通知を送信するMCPアプリです。主な目的は処理の完了時やユーザーの操作が必要な時にプッシュ通知を送ることです。

## 主要機能

- **登録開始処理**: Webブラウザでプッシュ通知の許諾を取得
- **通知送信**: AIが決定する短いメッセージの送信
- **登録解除**: ユーザーのプッシュ通知情報をクリア

## 重要な設計要件

- デスクトップPC/Mac環境で実行、通知先はデスクトップ/携帯電話を選択可能
- 異なる環境（携帯電話等）での許諾のためのURL送信機能が必要
- プログラミング言語と設計は自由
- 外部サービスの利用可能

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
- `src/services/NotificationService.ts`: Webプッシュ通知の管理クラス
- `src/mcp/MCPServer.ts`: MCPサーバーの実装
- `public/`: Webブラウザ用の静的ファイル
  - `index.html`: 通知登録用のWebページ
  - `app.js`: フロントエンドJavaScript
  - `sw.js`: Service Worker（プッシュ通知受信用）
- `rules/01-project-overview.mdc`: プロジェクト概要と技術スタック
- `rules/02-documentation-requirements.mdc`: ドキュメント更新時のチェックリスト

## 重要なファイル

- **NotificationService.ts**: FCMベース通知管理、データベース連携、ユーザー管理
- **MCPServer.ts**: 6つのMCPツール提供（send_notification, send_notification_to_all, register_user, list_subscriptions, remove_subscription, get_user_stats）
- **Service Worker**: Firebase Messaging Service Workerによるプッシュ通知受信処理

## 環境変数

```bash
# 必須: Firebase設定
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# 必須: Supabase設定
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# オプション
PORT=3000
NGROK_DOMAIN=your-domain.ngrok-free.app
```

## 設定と運用

FCMベースの通知システムとして以下の機能を提供：
- Firebase Cloud Messaging による通知配信
- Supabase データベースによる永続化
- ユーザーIDベースの通知管理
- 複数デバイス対応（デスクトップ・モバイル）
- ngrok対応によるリモートアクセス

## アーキテクチャ

### 技術スタック
- **通知**: Firebase Cloud Messaging (FCM)
- **データベース**: Supabase PostgreSQL
- **フロントエンド**: Firebase SDK + Service Worker
- **バックエンド**: Node.js + Express + Firebase Admin SDK
- **MCP**: 6つのツールでAI連携

### システム構成
- **ユーザー登録**: WebブラウザでFCMトークン取得 → Supabase保存
- **通知送信**: AI → MCPツール → Firebase Admin SDK → FCM → ユーザーデバイス
- **対応デバイス**: PC、Mac、iPhone、Android（ブラウザベース）

## 開発手順

### 開発環境の選択

プロジェクトでは2つの開発手法を選択可能：

#### 標準ツールでの開発（デフォルト・推奨）
- Claude Codeの標準ツール（Read, Write, Edit, Bash等）を使用
- 通常の開発作業、修正、機能追加に適している
- シンプルで直接的なファイル操作
- 標準的なGitワークフロー

#### Container-Use環境での開発
- **有効化**: `/container-use-on` コマンドを実行
- **重要**: `/container-use-on`実行後は、標準ツール（Read, Write, Edit, Bash等）は一切使用禁止
- **必須**: すべての操作でContainer-Use専用ツール（mcp__container-use__*）を使用
- **自動処理**: Git操作は環境が自動的に処理
- **適用場面**: 環境分離が必要な場合、大規模開発作業、複雑なGitワークフロー
- **無効化**: `/container-use-off` コマンドで標準ツールに戻る

### 標準開発ワークフロー（デフォルト）

1. **作業ブランチ作成**: masterから新しい作業ブランチを作成
2. **修正実装**: 標準ツール（Read, Write, Edit, Bash等）で修正を実装
3. **テスト・ビルド**: `npm test`, `npm run build`等で動作確認
4. **コミット**: 修正内容をcommit
5. **プルリクエスト**: 必要に応じてPR作成

### Container-Use環境での開発ワークフロー

1. **環境の作成・確認**: Container-Use環境でプロジェクトを開く
   * `mcp__container-use__environment_open`を使用してプロジェクト環境を作成
   * 環境IDを取得し、以降の作業で使用

2. **作業ブランチ作成**: 環境内でmasterから新しい作業ブランチを作成
   * Gitブランチ名は実装する内容から適当に決める
   * 作成元のGitブランチはmasterを使用
   * 環境のGitツールが自動的にGit操作を処理

3. **修正実装**: 環境内で指示された修正を実装
   * すべてのファイル操作は`mcp__container-use__environment_file_*`ツールを使用
   * コマンド実行は`mcp__container-use__environment_run_cmd`を使用
   * 複数回の修正でコミットログが汚くなることは気にしない

4. **作業完了とコミット統合**: 環境内で作業を完了し、コミットログを整理
   * Claude Codeが自動的に以下を実行：
     - `git log --oneline` でコミット履歴を確認
     - `git reset --soft HEAD~N` で複数コミットをステージング状態に戻す
     - `git commit -m "適切なコミットメッセージ"` で1つのコミットに統合
   * **重要**: ユーザーに`git checkout <branch_name>`でブランチを確認する方法を通知する

5. **継続作業**: 既存の環境と作業ブランチで追加修正を実行
   * エラー修正などは継続作業として既存ブランチで実行
   * 別タスクの場合は新しい作業ブランチを作成

## ドキュメント更新チェックリスト

重要な機能変更やMCPツールの変更時は、以下のドキュメントが正しく更新されているか必ず確認する：

### 必須更新対象ファイル
- [ ] **README.md** (メインドキュメント)
  - MCPツール一覧と説明
  - 技術スタック情報
  - 環境変数設定
  - セットアップ手順
  
- [ ] **docs/README-ja.md** (日本語詳細ドキュメント)
  - MCPツール一覧と詳細説明
  - 使用例とサンプルコード
  - トラブルシューティング
  
- [ ] **docs/README-en.md** (英語詳細ドキュメント)
  - MCPツール一覧と詳細説明
  - 使用例とサンプルコード
  - トラブルシューティング

### チェックポイント
1. **MCPツール数**: 3つのファイルで同じ数のツールが記載されているか
2. **パラメータ**: 各ツールのパラメータ説明が正確で一致しているか
3. **技術スタック**: 現在の実装（FCMベース）と一致しているか
4. **環境変数**: 必要な環境変数がすべて記載されているか
5. **設定例**: MCP設定やコード例が最新の仕様に対応しているか

### 更新漏れ防止のための作業手順
1. 機能変更実装後、上記3ファイルを順次更新
2. 各ファイルでMCPツール数を確認（現在は6つ）
3. git commitメッセージに「Update documentation」を含める
4. 作業完了前に必ずドキュメント整合性を確認する