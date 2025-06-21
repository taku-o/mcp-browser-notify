import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { NotificationService } from './services/NotificationService.js';
import { MCPServer } from './mcp/MCPServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const NGROK_DOMAIN = process.env.NGROK_DOMAIN;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const notificationService = new NotificationService();

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// === NEW FCM-based API endpoints ===

// ユーザー登録エンドポイント
app.post('/api/register', async (req, res) => {
  try {
    const { userId, fcmToken, deviceType = 'desktop', deviceInfo } = req.body;
    
    if (!userId || !fcmToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId と fcmToken は必須です' 
      });
    }

    const subscriptionId = await notificationService.addSubscription(
      userId,
      fcmToken,
      deviceType,
      deviceInfo
    );
    
    res.json({ success: true, subscriptionId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to register user' 
    });
  }
});

// 登録解除エンドポイント
app.delete('/api/unsubscribe/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    await notificationService.removeSubscription(subscriptionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to unsubscribe' 
    });
  }
});

// テスト通知エンドポイント
app.post('/api/test-notification', async (req, res) => {
  try {
    const { userId, message, title } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId と message は必須です' 
      });
    }

    await notificationService.sendNotification(userId, message, title);
    res.json({ success: true });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send test notification' 
    });
  }
});


// サーバー情報取得エンドポイント
app.get('/server-info', (req, res) => {
  const baseUrl = NGROK_DOMAIN ? `https://${NGROK_DOMAIN}` : `http://localhost:${PORT}`;
  res.json({ 
    baseUrl,
    isNgrok: !!NGROK_DOMAIN,
    port: PORT,
    version: '2.0.0-fcm'
  });
});

// === Health check and admin endpoints ===

// ヘルスチェックエンドポイント
app.get('/health', async (req, res) => {
  try {
    const userCount = await notificationService.getUserCount();
    const subscriptionCount = await notificationService.getSubscriptionCount();
    
    res.json({
      status: 'healthy',
      version: '2.0.0-fcm',
      timestamp: new Date().toISOString(),
      stats: {
        users: userCount,
        subscriptions: subscriptionCount
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 管理用エンドポイント（統計情報）
app.get('/admin/stats', async (req, res) => {
  try {
    const userCount = await notificationService.getUserCount();
    const subscriptionCount = await notificationService.getSubscriptionCount();
    const subscriptions = await notificationService.getSubscriptions();
    
    const deviceStats = subscriptions.reduce((acc, sub) => {
      acc[sub.deviceType] = (acc[sub.deviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      users: userCount,
      subscriptions: subscriptionCount,
      devices: deviceStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get stats' 
    });
  }
});

// エラーハンドリングミドルウェア
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404ハンドラ
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// MCPサーバーの初期化
const mcpServer = new MCPServer(notificationService);

async function startServer(): Promise<void> {
  try {
    // MCP only mode check (for Claude Code)
    const isMcpOnly = process.argv.includes('--mcp-only') || process.env.MCP_ONLY === 'true';
    
    if (isMcpOnly) {
      // MCP stdio mode only
      console.error('🔧 Starting MCP server in stdio mode only...');
      await mcpServer.start();
      console.error('✅ MCP server started successfully (stdio mode)');
      return;
    }
    
    // MCPサーバーを先に開始
    await mcpServer.start();
    
    // Expressサーバーを開始
    app.listen(PORT, () => {
      const baseUrl = NGROK_DOMAIN ? `https://${NGROK_DOMAIN}` : `http://localhost:${PORT}`;
      
      console.log(`🚀 MCP Browser Notify Server v2.0.0 (FCM-based)`);
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌐 Access URL: ${baseUrl}`);
      console.log(`🔧 MCP server started successfully`);
      
      if (NGROK_DOMAIN) {
        console.log(`🌐 Using ngrok domain: ${NGROK_DOMAIN}`);
      } else {
        console.log('💡 Set NGROK_DOMAIN environment variable to use ngrok');
      }

      console.log('\n📋 Required environment variables for FCM:');
      console.log('   - FIREBASE_SERVICE_ACCOUNT_KEY (JSON string)');
      console.log('   - FIREBASE_PROJECT_ID');
      console.log('   - SUPABASE_URL');
      console.log('   - SUPABASE_ANON_KEY');
      
      const hasFirebase = process.env.FIREBASE_SERVICE_ACCOUNT_KEY && process.env.FIREBASE_PROJECT_ID;
      const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
      
      console.log(`\n✅ Configuration status:`);
      console.log(`   Firebase: ${hasFirebase ? '✅ Configured' : '❌ Not configured'}`);
      console.log(`   Supabase: ${hasSupabase ? '✅ Configured' : '❌ Not configured'}`);
      
      if (!hasFirebase || !hasSupabase) {
        console.log('\n⚠️  Warning: Some services are not configured. The application may not work properly.');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// サーバー開始
startServer();