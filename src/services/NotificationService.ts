import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getMessaging, Message } from 'firebase-admin/messaging';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface UserSubscription {
  id: string;
  userId: string;
  fcmToken: string;
  deviceType: 'desktop' | 'mobile';
  deviceInfo: {
    userAgent?: string;
    platform?: string;
  };
  createdAt: Date;
  lastUsed: Date;
}

export interface Database {
  subscriptions: {
    Row: {
      id: string;
      user_id: string;
      fcm_token: string;
      device_type: 'desktop' | 'mobile';
      device_info: any;
      created_at: string;
      last_used: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      fcm_token: string;
      device_type: 'desktop' | 'mobile';
      device_info?: any;
      created_at?: string;
      last_used?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      fcm_token?: string;
      device_type?: 'desktop' | 'mobile';
      device_info?: any;
      created_at?: string;
      last_used?: string;
    };
  };
}

export class NotificationService {
  private supabase: SupabaseClient<Database>;
  private initialized = false;

  constructor() {
    this.initializeServices();
  }

  private initializeServices(): void {
    // Firebase Admin SDK initialization
    this.initializeFirebase();
    
    // Supabase initialization
    this.initializeSupabase();
    
    this.initialized = true;
  }

  private initializeFirebase(): void {
    if (getApps().length === 0) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      const projectId = process.env.FIREBASE_PROJECT_ID;

      if (!serviceAccountKey || !projectId) {
        console.warn('Firebase credentials not found. FCM notifications will not work.');
        console.warn('Please set FIREBASE_SERVICE_ACCOUNT_KEY and FIREBASE_PROJECT_ID environment variables.');
        return;
      }

      try {
        const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
        
        initializeApp({
          credential: cert(serviceAccount),
          projectId: projectId
        });
        
        console.log('Firebase Admin SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK:', error);
        throw new Error('Firebase initialization failed');
      }
    }
  }

  private initializeSupabase(): void {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase credentials not found. Database features will not work.');
      console.warn('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
      return;
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
    console.log('Supabase initialized successfully');
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('NotificationService not properly initialized');
    }
    
    if (!this.supabase) {
      throw new Error('Database not available. Please configure Supabase credentials.');
    }
  }

  public async addSubscription(
    userId: string,
    fcmToken: string,
    deviceType: 'desktop' | 'mobile' = 'desktop',
    deviceInfo?: { userAgent?: string; platform?: string }
  ): Promise<string> {
    this.ensureInitialized();

    const subscriptionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error } = await this.supabase
      .from('subscriptions')
      .insert({
        id: subscriptionId,
        user_id: userId,
        fcm_token: fcmToken,
        device_type: deviceType,
        device_info: deviceInfo || {},
        created_at: now,
        last_used: now
      });

    if (error) {
      console.error('Failed to add subscription:', error);
      throw new Error(`Failed to add subscription: ${error.message}`);
    }

    console.log(`Added subscription ${subscriptionId} for user ${userId} (${deviceType})`);
    return subscriptionId;
  }

  public async sendNotification(userId: string, message: string, title?: string): Promise<void> {
    this.ensureInitialized();

    // Get all subscriptions for the user
    const { data: subscriptions, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to get subscriptions:', error);
      throw new Error(`Failed to get subscriptions: ${error.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      throw new Error(`No subscriptions found for user ${userId}`);
    }

    const messaging = getMessaging();
    const results = [];

    for (const subscription of subscriptions) {
      try {
        const fcmMessage: Message = {
          token: subscription.fcm_token,
          notification: {
            title: title || 'MCP Browser Notify',
            body: message
          },
          data: {
            timestamp: Date.now().toString(),
            userId: userId
          },
          webpush: {
            notification: {
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              requireInteraction: false,
              timestamp: Date.now()
            }
          }
        };

        const response = await messaging.send(fcmMessage);
        console.log(`Notification sent to ${subscription.id}:`, response);
        
        // Update last_used timestamp
        await this.supabase
          .from('subscriptions')
          .update({ last_used: new Date().toISOString() })
          .eq('id', subscription.id);

        results.push({ subscriptionId: subscription.id, success: true });
      } catch (error) {
        console.error(`Failed to send notification to ${subscription.id}:`, error);
        
        // If token is invalid, remove the subscription
        if (error instanceof Error && (
          error.message.includes('registration-token-not-registered') ||
          error.message.includes('invalid-registration-token')
        )) {
          await this.removeSubscription(subscription.id);
          console.log(`Removed invalid subscription ${subscription.id}`);
        }
        
        results.push({ subscriptionId: subscription.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    console.log(`Notification sent to user ${userId}:`, message);
  }

  public async sendNotificationToAll(message: string, title?: string): Promise<void> {
    this.ensureInitialized();

    const { data: subscriptions, error } = await this.supabase
      .from('subscriptions')
      .select('*');

    if (error) {
      console.error('Failed to get all subscriptions:', error);
      throw new Error(`Failed to get subscriptions: ${error.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found');
      return;
    }

    const messaging = getMessaging();
    const userGroups = new Map<string, typeof subscriptions>();

    // Group subscriptions by user
    subscriptions.forEach(sub => {
      if (!userGroups.has(sub.user_id)) {
        userGroups.set(sub.user_id, []);
      }
      userGroups.get(sub.user_id)!.push(sub);
    });

    // Send notification to each user
    const promises = Array.from(userGroups.keys()).map(userId =>
      this.sendNotification(userId, message, title).catch(error => {
        console.error(`Failed to send notification to user ${userId}:`, error);
      })
    );

    await Promise.allSettled(promises);
    console.log(`Broadcast notification sent to ${userGroups.size} users`);
  }

  public async removeSubscription(subscriptionId: string): Promise<void> {
    this.ensureInitialized();

    const { error } = await this.supabase
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId);

    if (error) {
      console.error('Failed to remove subscription:', error);
      throw new Error(`Failed to remove subscription: ${error.message}`);
    }

    console.log(`Removed subscription ${subscriptionId}`);
  }

  public async getSubscriptions(userId?: string): Promise<UserSubscription[]> {
    this.ensureInitialized();

    let query = this.supabase.from('subscriptions').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: subscriptions, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get subscriptions:', error);
      throw new Error(`Failed to get subscriptions: ${error.message}`);
    }

    return (subscriptions || []).map(sub => ({
      id: sub.id,
      userId: sub.user_id,
      fcmToken: sub.fcm_token,
      deviceType: sub.device_type,
      deviceInfo: sub.device_info || {},
      createdAt: new Date(sub.created_at),
      lastUsed: new Date(sub.last_used)
    }));
  }

  public async getSubscriptionCount(userId?: string): Promise<number> {
    this.ensureInitialized();

    let query = this.supabase.from('subscriptions').select('id', { count: 'exact' });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Failed to get subscription count:', error);
      throw new Error(`Failed to get subscription count: ${error.message}`);
    }

    return count || 0;
  }

  public async getUserCount(): Promise<number> {
    this.ensureInitialized();

    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('user_id')
      .group('user_id');

    if (error) {
      console.error('Failed to get user count:', error);
      throw new Error(`Failed to get user count: ${error.message}`);
    }

    return data?.length || 0;
  }

  // For backward compatibility with existing web-push implementation
  public getVapidPublicKey(): string {
    console.warn('getVapidPublicKey() is deprecated. FCM uses different authentication.');
    return 'FCM_BASED_IMPLEMENTATION';
  }
}