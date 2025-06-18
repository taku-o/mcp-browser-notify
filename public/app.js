class FCMNotificationManager {
    constructor() {
        this.subscriptionId = localStorage.getItem('subscriptionId');
        this.userId = localStorage.getItem('userId');
        this.fcmToken = null;
        this.messaging = null;
        this.init();
    }

    async init() {
        await this.waitForFirebaseInit();
        this.setupEventListeners();
        this.updateUI();
        this.displayCurrentUrl();
        this.setupForegroundMessageHandling();
        
        // ユーザーIDの復元
        if (this.userId) {
            document.getElementById('userId').value = this.userId;
        }
        
        if (this.subscriptionId) {
            this.showStatus('既に通知が有効になっています', 'success');
            this.enableTestButton();
        }
    }

    async waitForFirebaseInit() {
        // Firebase初期化を待つ
        let attempts = 0;
        while (!window.firebaseMessaging && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.firebaseMessaging) {
            throw new Error('Firebase の初期化に失敗しました。Firebase設定を確認してください。');
        }
        
        this.messaging = window.firebaseMessaging;
        console.log('Firebase messaging initialized');
    }

    setupEventListeners() {
        document.getElementById('subscribeBtn').addEventListener('click', () => this.subscribe());
        document.getElementById('unsubscribeBtn').addEventListener('click', () => this.unsubscribe());
        document.getElementById('testNotifyBtn').addEventListener('click', () => this.sendTestNotification());
        
        // ユーザーID入力時の保存
        document.getElementById('userId').addEventListener('change', (e) => {
            this.userId = e.target.value.trim();
            if (this.userId) {
                localStorage.setItem('userId', this.userId);
            } else {
                localStorage.removeItem('userId');
            }
        });
    }

    setupForegroundMessageHandling() {
        if (!this.messaging) return;
        
        // フォアグラウンドでメッセージを受信した場合の処理
        window.onMessage(this.messaging, (payload) => {
            console.log('Foreground message received:', payload);
            
            const { title, body } = payload.notification || {};
            this.showStatus(`通知を受信: ${title || 'MCP Browser Notify'} - ${body}`, 'info');
            
            // ブラウザがフォーカスされていない場合は通知を表示
            if (document.hidden) {
                new Notification(title || 'MCP Browser Notify', {
                    body: body,
                    icon: '/icon-192x192.png'
                });
            }
        });
    }

    updateUI() {
        const subscribeBtn = document.getElementById('subscribeBtn');
        const unsubscribeBtn = document.getElementById('unsubscribeBtn');
        const subscriptionInfo = document.getElementById('subscriptionInfo');

        if (this.subscriptionId) {
            subscribeBtn.style.display = 'none';
            unsubscribeBtn.style.display = 'inline-block';
            subscriptionInfo.style.display = 'block';
            subscriptionInfo.innerHTML = `
                <strong>登録情報:</strong><br>
                ユーザーID: ${this.userId}<br>
                サブスクリプションID: ${this.subscriptionId}<br>
                登録日時: ${new Date(localStorage.getItem('subscriptionTime') || Date.now()).toLocaleString('ja-JP')}
            `;
        } else {
            subscribeBtn.style.display = 'inline-block';
            unsubscribeBtn.style.display = 'none';
            subscriptionInfo.style.display = 'none';
        }
    }

    async displayCurrentUrl() {
        try {
            const response = await fetch('/server-info');
            const serverInfo = await response.json();
            const urlElement = document.getElementById('currentUrl');
            
            if (serverInfo.isNgrok) {
                urlElement.textContent = serverInfo.baseUrl;
                urlElement.style.color = '#28a745';
            } else {
                urlElement.textContent = window.location.href;
                urlElement.style.color = '#6c757d';
            }
        } catch (error) {
            console.error('Failed to get server info:', error);
            document.getElementById('currentUrl').textContent = window.location.href;
        }
    }

    async subscribe() {
        try {
            // ユーザーIDの検証
            const userIdInput = document.getElementById('userId').value.trim();
            if (!userIdInput) {
                throw new Error('ユーザーIDを入力してください');
            }
            this.userId = userIdInput;
            localStorage.setItem('userId', this.userId);

            if (!this.messaging) {
                throw new Error('Firebase messaging が初期化されていません');
            }

            this.showStatus('通知の許可を求めています...', 'info');

            // 通知の許可を求める
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('通知の許可が拒否されました');
            }

            // Service Worker を登録
            await this.registerServiceWorker();

            // FCMトークンを取得
            this.showStatus('FCMトークンを取得しています...', 'info');
            
            try {
                this.fcmToken = await window.getToken(this.messaging, {
                    vapidKey: await this.getVapidKey() // VAPIDキーも必要
                });
            } catch (tokenError) {
                console.warn('VAPID key error, trying without:', tokenError);
                // VAPIDキーなしで試行
                this.fcmToken = await window.getToken(this.messaging);
            }

            if (!this.fcmToken) {
                throw new Error('FCMトークンの取得に失敗しました');
            }

            console.log('FCM Token obtained:', this.fcmToken);

            // デバイス情報を取得
            const deviceType = document.querySelector('input[name="deviceType"]:checked').value;
            const deviceInfo = {
                userAgent: navigator.userAgent,
                platform: navigator.platform
            };

            // サーバーに登録
            this.showStatus('サーバーに登録しています...', 'info');
            
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.userId,
                    fcmToken: this.fcmToken,
                    deviceType: deviceType,
                    deviceInfo: deviceInfo
                }),
            });

            const result = await response.json();
            
            if (result.success) {
                this.subscriptionId = result.subscriptionId;
                localStorage.setItem('subscriptionId', this.subscriptionId);
                localStorage.setItem('subscriptionTime', Date.now().toString());
                
                this.showStatus('通知の登録が完了しました！', 'success');
                this.updateUI();
                this.enableTestButton();
            } else {
                throw new Error(result.error || '登録に失敗しました');
            }
        } catch (error) {
            console.error('Subscription failed:', error);
            this.showStatus(`登録エラー: ${error.message}`, 'error');
        }
    }

    async getVapidKey() {
        try {
            const response = await fetch('/api/vapid-key');
            if (!response.ok) return null;
            const data = await response.json();
            return data.vapidKey;
        } catch (error) {
            console.warn('VAPID key not available:', error);
            return null;
        }
    }

    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Worker がサポートされていません');
        }

        if (!navigator.serviceWorker.controller) {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Service Worker の登録がタイムアウトしました')), 10000);
                
                if (registration.installing) {
                    registration.installing.addEventListener('statechange', function() {
                        if (this.state === 'activated') {
                            clearTimeout(timeout);
                            resolve();
                        }
                    });
                } else if (registration.active) {
                    clearTimeout(timeout);
                    resolve();
                }
            });
        }
    }

    async unsubscribe() {
        try {
            if (!this.subscriptionId) {
                throw new Error('登録されていません');
            }

            const response = await fetch(`/api/unsubscribe/${this.subscriptionId}`, {
                method: 'DELETE',
            });

            const result = await response.json();
            
            if (result.success) {
                localStorage.removeItem('subscriptionId');
                localStorage.removeItem('subscriptionTime');
                this.subscriptionId = null;
                
                this.showStatus('通知の登録を解除しました', 'success');
                this.updateUI();
                this.disableTestButton();
            } else {
                throw new Error(result.error || '登録解除に失敗しました');
            }
        } catch (error) {
            console.error('Unsubscribe failed:', error);
            this.showStatus(`登録解除エラー: ${error.message}`, 'error');
        }
    }

    async sendTestNotification() {
        try {
            if (!this.userId) {
                throw new Error('ユーザーIDが設定されていません');
            }

            if (!this.subscriptionId) {
                throw new Error('通知が登録されていません');
            }

            const message = document.getElementById('testMessage').value || 'テスト通知です！';
            const title = document.getElementById('testTitle').value || undefined;
            
            const response = await fetch('/api/test-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.userId,
                    message: message,
                    title: title
                }),
            });

            const result = await response.json();
            
            if (result.success) {
                this.showStatus('テスト通知を送信しました！', 'success');
            } else {
                throw new Error(result.error || 'テスト通知の送信に失敗しました');
            }
        } catch (error) {
            console.error('Test notification failed:', error);
            this.showStatus(`テスト通知エラー: ${error.message}`, 'error');
        }
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.className = '';
            }, 5000);
        }
    }

    enableTestButton() {
        document.getElementById('testNotifyBtn').disabled = false;
    }

    disableTestButton() {
        document.getElementById('testNotifyBtn').disabled = true;
    }
}

// Firebase初期化後にマネージャーを開始
document.addEventListener('DOMContentLoaded', () => {
    try {
        new FCMNotificationManager();
    } catch (error) {
        console.error('Failed to initialize FCM Notification Manager:', error);
        
        const statusDiv = document.getElementById('status');
        if (statusDiv) {
            statusDiv.textContent = `初期化エラー: ${error.message}`;
            statusDiv.className = 'status error';
        }
    }
});