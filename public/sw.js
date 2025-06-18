// Firebase Messaging Service Worker for FCM notifications

// Firebase SDKをインポート
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase設定（実際のプロジェクト設定に変更してください）
const firebaseConfig = {
    // TODO: 実際のFirebaseプロジェクトの設定に変更
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Firebase初期化
try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    
    console.log('Firebase messaging initialized in service worker');
    
    // バックグラウンドメッセージのハンドリング
    messaging.onBackgroundMessage((payload) => {
        console.log('Background message received:', payload);
        
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
    console.error('Failed to initialize Firebase in service worker:', error);
}

// 通常のpushイベントハンドラ（FCMがない場合のフォールバック）
self.addEventListener('push', function(event) {
    console.log('Push event received (fallback):', event);
    
    if (!event.data) {
        return;
    }

    try {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/icon-192x192.png',
            badge: data.badge || '/badge-72x72.png',
            timestamp: data.timestamp || Date.now(),
            requireInteraction: false,
            data: data.data || {},
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

        event.waitUntil(
            self.registration.showNotification(data.title || 'MCP Browser Notify', options)
        );
    } catch (error) {
        console.error('Push event error:', error);
        
        const fallbackOptions = {
            body: event.data.text() || '新しい通知があります',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            timestamp: Date.now(),
            requireInteraction: false
        };
        
        event.waitUntil(
            self.registration.showNotification('MCP Browser Notify', fallbackOptions)
        );
    }
});

// 通知クリックイベントのハンドリング
self.addEventListener('notificationclick', function(event) {
    console.log('Notification click received:', event.notification.title, event.action);
    
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
    console.log('Notification closed:', event.notification.title);
    
    // 必要に応じて分析用のイベントを送信
    // analytics.track('notification_closed', { title: event.notification.title });
});

// Service Worker インストール時
self.addEventListener('install', function(event) {
    console.log('Service Worker installing');
    self.skipWaiting();
});

// Service Worker アクティベート時
self.addEventListener('activate', function(event) {
    console.log('Service Worker activating');
    event.waitUntil(self.clients.claim());
});

// メッセージハンドラ（メインスレッドからの通信用）
self.addEventListener('message', function(event) {
    console.log('Message received in service worker:', event.data);
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: '2.0.0-fcm',
            firebase: typeof firebase !== 'undefined'
        });
    }
});