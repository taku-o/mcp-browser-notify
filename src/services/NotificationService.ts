import webpush from 'web-push';
import crypto from 'crypto';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface StoredSubscription extends PushSubscription {
  id: string;
  deviceType: 'desktop' | 'mobile';
  createdAt: Date;
}

export class NotificationService {
  private subscriptions: Map<string, StoredSubscription> = new Map();
  private vapidPublicKey: string;
  private vapidPrivateKey: string;

  constructor() {
    this.initializeVapidKeys();
    this.setupWebPush();
  }

  private initializeVapidKeys(): void {
    const existingPublicKey = process.env.VAPID_PUBLIC_KEY;
    const existingPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (existingPublicKey && existingPrivateKey) {
      this.vapidPublicKey = existingPublicKey;
      this.vapidPrivateKey = existingPrivateKey;
    } else {
      const vapidKeys = webpush.generateVAPIDKeys();
      this.vapidPublicKey = vapidKeys.publicKey;
      this.vapidPrivateKey = vapidKeys.privateKey;
      
      console.log('Generated VAPID keys:');
      console.log('Public Key:', this.vapidPublicKey);
      console.log('Private Key:', this.vapidPrivateKey);
      console.log('Please save these keys to your environment variables');
    }
  }

  private setupWebPush(): void {
    webpush.setVapidDetails(
      'mailto:your-email@example.com',
      this.vapidPublicKey,
      this.vapidPrivateKey
    );
  }

  public getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }

  public async addSubscription(subscription: PushSubscription, deviceType: 'desktop' | 'mobile' = 'desktop'): Promise<string> {
    const id = crypto.randomUUID();
    const storedSubscription: StoredSubscription = {
      ...subscription,
      id,
      deviceType,
      createdAt: new Date()
    };

    this.subscriptions.set(id, storedSubscription);
    console.log(`Added subscription ${id} for ${deviceType} device`);
    
    return id;
  }

  public async sendNotification(subscriptionId: string, message: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    const payload = JSON.stringify({
      title: 'MCP Browser Notify',
      body: message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      timestamp: Date.now()
    });

    try {
      await webpush.sendNotification(subscription, payload);
      console.log(`Notification sent to ${subscriptionId}: ${message}`);
    } catch (error) {
      console.error(`Failed to send notification to ${subscriptionId}:`, error);
      
      if (error instanceof Error && error.message.includes('410')) {
        this.subscriptions.delete(subscriptionId);
        console.log(`Removed invalid subscription ${subscriptionId}`);
      }
      
      throw error;
    }
  }

  public async sendNotificationToAll(message: string): Promise<void> {
    const notifications = Array.from(this.subscriptions.entries()).map(
      async ([id, subscription]) => {
        try {
          await this.sendNotification(id, message);
        } catch (error) {
          console.error(`Failed to send notification to ${id}:`, error);
        }
      }
    );

    await Promise.allSettled(notifications);
  }

  public async removeSubscription(subscriptionId: string): Promise<void> {
    const removed = this.subscriptions.delete(subscriptionId);
    
    if (removed) {
      console.log(`Removed subscription ${subscriptionId}`);
    } else {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }
  }

  public getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  public getSubscriptions(): StoredSubscription[] {
    return Array.from(this.subscriptions.values());
  }
}