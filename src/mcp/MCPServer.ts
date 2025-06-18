import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types';
import { NotificationService } from '../services/NotificationService.js';

export class MCPServer {
  private server: Server;

  constructor(private notificationService: NotificationService) {
    this.server = new Server({
      name: 'mcp-browser-notify',
      version: '2.0.0'
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'send_notification',
            description: 'Send a push notification to a specific user',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  description: 'The ID of the user to send notification to'
                },
                message: {
                  type: 'string',
                  description: 'The message to send in the notification'
                },
                title: {
                  type: 'string',
                  description: 'Optional title for the notification (defaults to "MCP Browser Notify")'
                }
              },
              required: ['userId', 'message']
            }
          },
          {
            name: 'send_notification_to_all',
            description: 'Send a push notification to all registered users',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'The message to send in the notification'
                },
                title: {
                  type: 'string',
                  description: 'Optional title for the notification (defaults to "MCP Browser Notify")'
                }
              },
              required: ['message']
            }
          },
          {
            name: 'register_user',
            description: 'Register a new user with FCM token for push notifications',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  description: 'Unique identifier for the user'
                },
                fcmToken: {
                  type: 'string',
                  description: 'Firebase Cloud Messaging token for the device'
                },
                deviceType: {
                  type: 'string',
                  enum: ['desktop', 'mobile'],
                  description: 'Type of device (desktop or mobile)'
                },
                deviceInfo: {
                  type: 'object',
                  properties: {
                    userAgent: { type: 'string' },
                    platform: { type: 'string' }
                  },
                  description: 'Optional device information'
                }
              },
              required: ['userId', 'fcmToken']
            }
          },
          {
            name: 'list_subscriptions',
            description: 'List all active push notification subscriptions, optionally filtered by user',
            inputSchema: {
              type: 'object',
              properties: {
                userId: {
                  type: 'string',
                  description: 'Optional user ID to filter subscriptions'
                }
              }
            }
          },
          {
            name: 'remove_subscription',
            description: 'Remove a push notification subscription',
            inputSchema: {
              type: 'object',
              properties: {
                subscriptionId: {
                  type: 'string',
                  description: 'The ID of the subscription to remove'
                }
              },
              required: ['subscriptionId']
            }
          },
          {
            name: 'get_user_stats',
            description: 'Get statistics about users and subscriptions',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'send_notification': {
            const { userId, message, title } = args as { userId: string; message: string; title?: string };
            
            await this.notificationService.sendNotification(userId, message, title);
            
            const userSubscriptions = await this.notificationService.getSubscriptions(userId);
            const deviceTypes = [...new Set(userSubscriptions.map(sub => sub.deviceType))];
            
            return {
              content: [
                {
                  type: 'text',
                  text: `通知を送信しました (ユーザー: ${userId}, デバイス: ${deviceTypes.join(', ')})\nメッセージ: ${message}`
                }
              ]
            };
          }

          case 'send_notification_to_all': {
            const { message, title } = args as { message: string; title?: string };
            
            const totalUsers = await this.notificationService.getUserCount();
            const totalSubscriptions = await this.notificationService.getSubscriptionCount();
            
            await this.notificationService.sendNotificationToAll(message, title);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `全ユーザーに通知を送信しました (${totalUsers}ユーザー, ${totalSubscriptions}デバイス)\nメッセージ: ${message}`
                }
              ]
            };
          }

          case 'register_user': {
            const { userId, fcmToken, deviceType = 'desktop', deviceInfo } = args as {
              userId: string;
              fcmToken: string;
              deviceType?: 'desktop' | 'mobile';
              deviceInfo?: { userAgent?: string; platform?: string };
            };
            
            const subscriptionId = await this.notificationService.addSubscription(
              userId,
              fcmToken,
              deviceType,
              deviceInfo
            );
            
            return {
              content: [
                {
                  type: 'text',
                  text: `ユーザーを登録しました\nユーザーID: ${userId}\nサブスクリプションID: ${subscriptionId}\nデバイス: ${deviceType}`
                }
              ]
            };
          }

          case 'list_subscriptions': {
            const { userId } = args as { userId?: string };
            
            const subscriptions = await this.notificationService.getSubscriptions(userId);
            
            if (subscriptions.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: userId 
                      ? `ユーザー ${userId} の通知登録はありません`
                      : '登録済みの通知はありません'
                  }
                ]
              };
            }

            const subscriptionList = subscriptions.map(sub => {
              const deviceInfo = sub.deviceInfo.platform || sub.deviceInfo.userAgent ? 
                ` (${sub.deviceInfo.platform || 'Unknown Platform'})` : '';
              
              return [
                `サブスクリプションID: ${sub.id}`,
                `ユーザーID: ${sub.userId}`,
                `デバイス: ${sub.deviceType}${deviceInfo}`,
                `登録日時: ${sub.createdAt.toLocaleString('ja-JP')}`,
                `最終使用: ${sub.lastUsed.toLocaleString('ja-JP')}`,
                '---'
              ].join('\n');
            }).join('\n');
            
            const totalUsers = userId ? 1 : [...new Set(subscriptions.map(sub => sub.userId))].length;
            
            return {
              content: [
                {
                  type: 'text',
                  text: `通知登録一覧 (${totalUsers}ユーザー, ${subscriptions.length}サブスクリプション):\n\n${subscriptionList}`
                }
              ]
            };
          }

          case 'remove_subscription': {
            const { subscriptionId } = args as { subscriptionId: string };
            
            await this.notificationService.removeSubscription(subscriptionId);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `通知登録を削除しました: ${subscriptionId}`
                }
              ]
            };
          }

          case 'get_user_stats': {
            const totalUsers = await this.notificationService.getUserCount();
            const totalSubscriptions = await this.notificationService.getSubscriptionCount();
            
            const subscriptions = await this.notificationService.getSubscriptions();
            const deviceStats = subscriptions.reduce((acc, sub) => {
              acc[sub.deviceType] = (acc[sub.deviceType] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            const statsText = [
              `総ユーザー数: ${totalUsers}`,
              `総サブスクリプション数: ${totalSubscriptions}`,
              '',
              'デバイス別統計:',
              ...Object.entries(deviceStats).map(([type, count]) => `  ${type}: ${count}件`)
            ].join('\n');

            return {
              content: [
                {
                  type: 'text',
                  text: statsText
                }
              ]
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Add more specific error handling for common issues
        let userFriendlyMessage = errorMessage;
        if (errorMessage.includes('Firebase')) {
          userFriendlyMessage = 'Firebase設定に問題があります。FIREBASE_SERVICE_ACCOUNT_KEYとFIREBASE_PROJECT_IDが正しく設定されているか確認してください。';
        } else if (errorMessage.includes('Supabase') || errorMessage.includes('Database')) {
          userFriendlyMessage = 'データベース接続に問題があります。SUPABASE_URLとSUPABASE_ANON_KEYが正しく設定されているか確認してください。';
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `エラーが発生しました: ${userFriendlyMessage}`
            }
          ],
          isError: true
        };
      }
    });
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('MCP server started successfully (FCM-based version 2.0.0)');
  }
}