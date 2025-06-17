class NotificationManager {
    constructor() {
        this.subscriptionId = localStorage.getItem('subscriptionId');
        this.vapidPublicKey = null;
        this.init();
    }

    async init() {
        await this.loadVapidPublicKey();
        this.setupEventListeners();
        this.updateUI();
        this.displayCurrentUrl();
        
        if (this.subscriptionId) {
            this.showStatus('既に通知が有効になっています', 'success');
            this.enableTestButton();
        }
    }

    async loadVapidPublicKey() {
        try {
            const response = await fetch('/vapid-public-key');
            const data = await response.json();
            this.vapidPublicKey = data.publicKey;
        } catch (error) {
            console.error('Failed to load VAPID public key:', error);
            this.showStatus('VAPIDキーの読み込みに失敗しました', 'error');
        }
    }

    setupEventListeners() {
        document.getElementById('subscribeBtn').addEventListener('click', () => this.subscribe());
        document.getElementById('unsubscribeBtn').addEventListener('click', () => this.unsubscribe());
        document.getElementById('testNotifyBtn').addEventListener('click', () => this.sendTestNotification());
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
                ID: ${this.subscriptionId}<br>
                登録日時: ${new Date(localStorage.getItem('subscriptionTime') || Date.now()).toLocaleString('ja-JP')}
            `;
        } else {
            subscribeBtn.style.display = 'inline-block';
            unsubscribeBtn.style.display = 'none';
            subscriptionInfo.style.display = 'none';
        }
    }

    displayCurrentUrl() {
        document.getElementById('currentUrl').textContent = window.location.href;
    }

    async subscribe() {
        try {
            if (!('serviceWorker' in navigator)) {
                throw new Error('Service Worker がサポートされていません');
            }

            if (!('PushManager' in window)) {
                throw new Error('Push messaging がサポートされていません');
            }

            this.showStatus('通知の許可を求めています...', 'info');

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('通知の許可が拒否されました');
            }

            await this.registerServiceWorker();
            const subscription = await this.createPushSubscription();
            
            const deviceType = document.querySelector('input[name="deviceType"]:checked').value;
            
            const response = await fetch('/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: subscription,
                    deviceType: deviceType
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

    async registerServiceWorker() {
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

    async createPushSubscription() {
        const registration = await navigator.serviceWorker.ready;
        
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });

        return subscription;
    }

    async unsubscribe() {
        try {
            if (!this.subscriptionId) {
                throw new Error('登録されていません');
            }

            const response = await fetch(`/unsubscribe/${this.subscriptionId}`, {
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
            if (!this.subscriptionId) {
                throw new Error('通知が登録されていません');
            }

            const message = document.getElementById('testMessage').value || 'テスト通知です！';
            
            const response = await fetch('/notify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscriptionId: this.subscriptionId,
                    message: message
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

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

new NotificationManager();