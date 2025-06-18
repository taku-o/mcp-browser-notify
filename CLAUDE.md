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
- `rules/00-project-requirements.mdc`: プロジェクト要件定義（日本語）
- `rules/01-updates-projects.mdc`: プロジェクト改善要件（英語README、MCP設定、ngrok対応、UI改善）
- `rules/02-updates-projects.mdc`: プロジェクト改善要件（ngrok改善、Dockerサポート）
- `rules/03-direct-docker.mdc`: 利用手順の改善要件（直接Node実行とDocker実行の分離記載）
- `rules/05-how-to-proceed-with-development.mdc`: 開発手順ガイドライン（Git作業フロー）

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

## 改善要件（rules/01-updates-projects.mdc）

- **ドキュメント**: 英語版README作成（docs/ディレクトリに配置）
- **MCP設定**: mcp.json設定例とMCP呼び出し例をREADMEに追加
- **ngrok対応**: ngrokドメイン利用でlocalhost以外での通知対応
- **UI改善**: QRコード共有機能の削除（該当メッセージの除去）

## 改善要件（rules/02-updates-projects.mdc）

- **ngrok改善**: ngrok.yml設定ファイルとngrok利用手順の詳細化
- **Dockerサポート**: Dockerfile、docker-compose.yml追加とDocker実行手順

## 改善要件（rules/03-direct-docker.mdc）

- **利用手順の分離**: 直接Node実行とDocker実行の手順を明確に分けて記載
- **具体的な手順**: ngrok設定→サーバー起動→MCP設定の流れを両方式で詳述

## 開発手順（rules/05-how-to-proceed-with-development.mdc）

開発作業は以下のGitワークフローに従って実行します：

1. **環境確認**: `git status`で現在の環境がクリーンであることを確認
2. **作業ブランチ作成**: `git switch -c [branch-name]`でmasterから新しい作業ブランチを作成
3. **修正実装**: 指示された修正を実装し、完了後に作業ブランチにcommit
4. **作業完了**: 作業完了報告時は作業ブランチの状態のまま
5. **継続作業**: 追加修正は既存の作業ブランチで実行（別タスクの場合は新ブランチ作成）