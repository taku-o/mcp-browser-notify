import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types';
import { NotificationService } from '../services/NotificationService.js';

export class MCPServer {
  private server: Server;

  constructor(private notificationService: NotificationService) {
    this.server = new Server({
      name: 'mcp-browser-notify',
      version: '1.0.0'
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'send_notification',
            description: 'Send a push notification to a specific subscription',
            inputSchema: {
              type: 'object',
              properties: {
                subscriptionId: {
                  type: 'string',
                  description: 'The ID of the subscription to send notification to'
                },
                message: {
                  type: 'string',
                  description: 'The message to send in the notification'
                }
              },
              required: ['subscriptionId', 'message']
            }
          },
          {
            name: 'send_notification_to_all',
            description: 'Send a push notification to all subscribed devices',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'The message to send in the notification'
                }
              },
              required: ['message']
            }
          },
          {
            name: 'list_subscriptions',
            description: 'List all active push notification subscriptions',
            inputSchema: {
              type: 'object',
              properties: {}
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
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'send_notification': {
            const { subscriptionId, message } = args as { subscriptionId: string; message: string };
            await this.notificationService.sendNotification(subscriptionId, message);
            return {
              content: [
                {
                  type: 'text',
                  text: `通知を送信しました: ${message}`
                }
              ]
            };
          }

          case 'send_notification_to_all': {
            const { message } = args as { message: string };
            await this.notificationService.sendNotificationToAll(message);
            const count = this.notificationService.getSubscriptionCount();
            return {
              content: [
                {
                  type: 'text',
                  text: `${count}件の登録済みデバイスに通知を送信しました: ${message}`
                }
              ]
            };
          }

          case 'list_subscriptions': {
            const subscriptions = this.notificationService.getSubscriptions();
            const subscriptionList = subscriptions.map(sub => 
              `ID: ${sub.id}, デバイス: ${sub.deviceType}, 登録日時: ${sub.createdAt.toLocaleString('ja-JP')}`
            ).join('\n');
            
            return {
              content: [
                {
                  type: 'text',
                  text: subscriptions.length > 0 
                    ? `登録済み通知 (${subscriptions.length}件):\n${subscriptionList}`
                    : '登録済みの通知はありません'
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

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: `エラーが発生しました: ${errorMessage}`
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
    console.log('MCP server started successfully');
  }
}