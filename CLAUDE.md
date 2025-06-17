# CLAUDE.md

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
- `rules/00-project-requirements.mdc`: プロジェクト要件定義（日本語）
- `docs/setup.md`: セットアップ手順

## 重要なファイル

- **NotificationService.ts**: VAPIDキー管理、通知の送信・登録・削除
- **MCPServer.ts**: 4つのMCPツール提供（send_notification, send_notification_to_all, list_subscriptions, remove_subscription）
- **Service Worker**: ブラウザでのプッシュ通知受信処理

## 環境変数

```bash
# オプション: 既存のVAPIDキーを使用する場合
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
PORT=3000
```