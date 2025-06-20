class FCMNotificationManager {
    constructor() {
        this.subscriptionId = localStorage.getItem('subscriptionId');
        this.userId = localStorage.getItem('userId');
        this.fcmToken = null;
        this.messaging = null;
        
        // 無効な登録時刻データをクリーンアップ
        this.cleanupInvalidTimestamp();
        
        this.init();
    }

    cleanupInvalidTimestamp() {
        const timestamp = localStorage.getItem('subscriptionTime');
        if (timestamp) {
            const time = parseInt(timestamp);
            if (isNaN(time) || time <= 0) {
                console.log('Invalid timestamp detected, cleaning up...');
                localStorage.removeItem('subscriptionTime');
            }
        }
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
        // ブラウザサポートチェック
        if (!('serviceWorker' in navigator)) {
            throw new Error('このブラウザはService Workerをサポートしていません');
        }

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
            this.showStatus(`通知を受信: ${title || window.AppConfig.notification.defaultTitle} - ${body}`, 'info');
            
            // ブラウザがフォーカスされていない場合は通知を表示
            if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                const config = window.AppConfig.notification;
                new Notification(title || config.defaultTitle, {
                    body: body,
                    icon: config.defaultIcon
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
                登録日時: ${this.formatDateTime(localStorage.getItem('subscriptionTime'))}
            `;
        } else {
            subscribeBtn.style.display = 'inline-block';
            unsubscribeBtn.style.display = 'none';
            subscriptionInfo.style.display = 'none';
        }
    }

    async displayCurrentUrl() {
        try {
            const response = await fetch(window.AppConfig.api.endpoints.serverInfo);
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

            // 通知の許可を求める（ブラウザ互換性を考慮）
            let permission;
            if (!('Notification' in window)) {
                throw new Error('このブラウザは通知をサポートしていません');
            } else if (Notification.permission === 'granted') {
                permission = 'granted';
            } else if (Notification.permission !== 'denied') {
                // 古いブラウザ向けの互換性対応
                if (typeof Notification.requestPermission === 'function') {
                    permission = await Notification.requestPermission();
                } else {
                    // 非常に古いブラウザ向け
                    permission = Notification.requestPermission(function(result) {
                        return result;
                    });
                }
            } else {
                throw new Error('通知の許可が拒否されています。ブラウザ設定で許可してください。');
            }

            if (permission !== 'granted') {
                throw new Error('通知の許可が拒否されました');
            }

            // Service Workerを明示的に登録してからFCMトークンを取得
            this.showStatus('Service Workerを登録しています...', 'info');
            
            // Service Worker登録
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration);
            
            this.showStatus('FCMトークンを取得しています...', 'info');
            
            // VAPIDキーを設定してFCMトークンを取得（Service Worker指定）
            this.fcmToken = await window.getToken(this.messaging, {
                vapidKey: window.AppConfig.vapidKey,
                serviceWorkerRegistration: registration
            });

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
            
            const response = await fetch(window.AppConfig.api.endpoints.register, {
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



    async unsubscribe() {
        try {
            if (!this.subscriptionId) {
                throw new Error('登録されていません');
            }

            const response = await fetch(`${window.AppConfig.api.endpoints.unsubscribe}/${this.subscriptionId}`, {
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
            
            const response = await fetch(window.AppConfig.api.endpoints.testNotification, {
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

    formatDateTime(timestamp) {
        try {
            // timestampが存在しない場合は現在時刻を使用
            const time = timestamp ? parseInt(timestamp) : Date.now();
            const date = new Date(time);
            
            // 日付が無効な場合の処理
            if (isNaN(date.getTime())) {
                return '登録日時不明';
            }
            
            // Safari互換性を考慮した日付フォーマット
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
        } catch (error) {
            console.error('Date formatting error:', error);
            return '登録日時不明';
        }
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