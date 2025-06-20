// config.js - 環境依存設定ファイル
// このファイルで環境固有の設定値を管理します

// Service Workerとメインスレッド両方で動作するように設定
const AppConfig = {
    // Firebase設定
    firebase: {
        apiKey: "AIzaSyDX1234567890abcdefghijklmnopqrstuvwxyz",
        authDomain: "mcp-browser-notify.firebaseapp.com",
        projectId: "mcp-browser-notify",
        storageBucket: "mcp-browser-notify.appspot.com",
        messagingSenderId: "123456789012",
        appId: "1:123456789012:web:abcdef1234567890abcdef"
    },

    // FCM VAPID公開鍵
    vapidKey: "BK4dMBCnZXZWVZCnUZyMp7mP8rUMy8sJDsKkVsM8yJoWnS8VQZJl4gDJsUt8VQZJl4gDJsUt8VQZJl4gDJsUt8",

    // API設定
    api: {
        baseUrl: "", // 相対パス使用
        endpoints: {
            register: "/api/register",
            unsubscribe: "/api/unsubscribe",
            testNotification: "/api/test-notification",
            serverInfo: "/server-info"
        }
    },

    // 通知設定
    notification: {
        defaultTitle: "MCP Browser Notify",
        defaultBody: "新しい通知があります",
        defaultIcon: "/icon-192x192.png",
        defaultBadge: "/badge-72x72.png",
        actions: [
            {
                action: "view",
                title: "確認"
            },
            {
                action: "close", 
                title: "閉じる"
            }
        ]
    },

    // アプリケーション設定
    app: {
        version: "2.0.0-fcm",
        name: "MCP Browser Notify",
        description: "Firebase Cloud Messaging を使用したプッシュ通知システム"
    }
};

// メインスレッド（window）とService Worker（self）の両方で利用可能にする
if (typeof window !== 'undefined') {
    window.AppConfig = AppConfig;
}
if (typeof self !== 'undefined') {
    self.AppConfig = AppConfig;
}