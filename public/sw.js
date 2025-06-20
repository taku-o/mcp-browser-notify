// Firebase Messaging Service Worker for FCM notifications

// 設定ファイルをインポート
importScripts('config.js');

// Firebase SDKをインポート
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// config.jsから設定を取得
if (!self.AppConfig) {
    console.error('設定ファイル(config.js)が読み込まれていません');
    throw new Error('設定ファイル(config.js)が読み込まれていません');
}

console.log('Service Worker: AppConfig loaded successfully');

const firebaseConfig = self.AppConfig.firebase;

// Firebase初期化
try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    
    console.log('Firebase messaging initialized in service worker');
    
    // バックグラウンドメッセージのハンドリング
    messaging.onBackgroundMessage((payload) => {
        console.log('Background message received:', payload);
        
        const { title, body, icon, data } = payload.notification || {};
        const config = self.AppConfig.notification;
        const notificationTitle = title || config.defaultTitle;
        const notificationOptions = {
            body: body || config.defaultBody,
            icon: icon || config.defaultIcon,
            badge: config.defaultBadge,
            timestamp: Date.now(),
            requireInteraction: false,
            data: data || {},
            actions: config.actions
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
        const config = self.AppConfig.notification;
        const options = {
            body: data.body,
            icon: data.icon || config.defaultIcon,
            badge: data.badge || config.defaultBadge,
            timestamp: data.timestamp || Date.now(),
            requireInteraction: false,
            data: data.data || {},
            actions: config.actions
        };

        event.waitUntil(
            self.registration.showNotification(data.title || config.defaultTitle, options)
        );
    } catch (error) {
        console.error('Push event error:', error);
        
        const config = self.AppConfig.notification;
        const fallbackOptions = {
            body: event.data.text() || config.defaultBody,
            icon: config.defaultIcon,
            badge: config.defaultBadge,
            timestamp: Date.now(),
            requireInteraction: false
        };
        
        event.waitUntil(
            self.registration.showNotification(config.defaultTitle, fallbackOptions)
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
        const config = self.AppConfig.app;
        event.ports[0].postMessage({
            version: config.version,
            firebase: typeof firebase !== 'undefined',
            appName: config.name
        });
    }
});