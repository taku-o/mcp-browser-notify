// Firebase Messaging Service Worker
// This file is required by Firebase Cloud Messaging

// Firebase SDKをインポート
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase設定（実際のプロジェクト設定に変更してください）
const firebaseConfig = {
    apiKey: "AIzaSyDX1234567890abcdefghijklmnopqrstuvwxyz",
    authDomain: "mcp-browser-notify.firebaseapp.com",
    projectId: "mcp-browser-notify",
    storageBucket: "mcp-browser-notify.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Firebase初期化
try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    
    console.log('Firebase messaging initialized in firebase-messaging-sw.js');
    
    // バックグラウンドメッセージのハンドリング
    messaging.onBackgroundMessage((payload) => {
        console.log('Background message received in firebase-messaging-sw.js:', payload);
        
        const { title, body, icon, data } = payload.notification || {};
        const notificationTitle = title || 'MCP Browser Notify';
        const notificationOptions = {
            body: body || '新しい通知があります',
            icon: icon || '/icon-192x192.png',
            badge: '/badge-72x72.png',
            timestamp: Date.now(),
            requireInteraction: false,
            data: data || {},
            actions: [
                {
                    action: 'view',
                    title: '確認'
                },
                {
                    action: 'close',
                    title: '閉じる'
                }
            ]
        };

        return self.registration.showNotification(notificationTitle, notificationOptions);
    });
    
} catch (error) {
    console.error('Failed to initialize Firebase in firebase-messaging-sw.js:', error);
}

// 通知クリックイベントのハンドリング
self.addEventListener('notificationclick', function(event) {
    console.log('Notification click received in firebase-messaging-sw.js:', event.notification.title, event.action);
    
    event.notification.close();

    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // 何もしない（通知は既に閉じられている）
    } else {
        // デフォルトアクション（通知本体のクリック）
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
                // 既に開いているタブがあればフォーカス
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // 開いているタブがなければ新しいタブを開く
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    }
});

// 通知が閉じられた時のイベント
self.addEventListener('notificationclose', function(event) {
    console.log('Notification closed in firebase-messaging-sw.js:', event.notification.title);
});

// Service Worker インストール時
self.addEventListener('install', function(event) {
    console.log('Firebase messaging service worker installing');
    self.skipWaiting();
});

// Service Worker アクティベート時
self.addEventListener('activate', function(event) {
    console.log('Firebase messaging service worker activating');
    event.waitUntil(self.clients.claim());
});