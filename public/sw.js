self.addEventListener('push', function(event) {
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
            badge: '/badge-72x72.png'
        };
        
        event.waitUntil(
            self.registration.showNotification('MCP Browser Notify', fallbackOptions)
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        
    } else {
        event.waitUntil(
            clients.matchAll().then(function(clientList) {
                if (clientList.length > 0) {
                    return clientList[0].focus();
                }
                return clients.openWindow('/');
            })
        );
    }
});

self.addEventListener('notificationclose', function(event) {
    console.log('Notification closed:', event.notification.title);
});