import express from 'express';
import path from 'path';
import { NotificationService } from './services/NotificationService';
import { MCPServer } from './mcp/MCPServer';

const app = express();
const PORT = process.env.PORT || 3000;
const NGROK_DOMAIN = process.env.NGROK_DOMAIN;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const notificationService = new NotificationService();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.post('/subscribe', async (req, res) => {
  try {
    const { subscription, deviceType } = req.body;
    const subscriptionId = await notificationService.addSubscription(subscription, deviceType);
    res.json({ success: true, subscriptionId });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ success: false, error: 'Failed to subscribe' });
  }
});

app.post('/notify', async (req, res) => {
  try {
    const { message, subscriptionId } = req.body;
    await notificationService.sendNotification(subscriptionId, message);
    res.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

app.delete('/unsubscribe/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    await notificationService.removeSubscription(subscriptionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ success: false, error: 'Failed to unsubscribe' });
  }
});

app.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: notificationService.getVapidPublicKey() });
});

app.get('/server-info', (req, res) => {
  const baseUrl = NGROK_DOMAIN ? `https://${NGROK_DOMAIN}` : `http://localhost:${PORT}`;
  res.json({ 
    baseUrl,
    isNgrok: !!NGROK_DOMAIN,
    port: PORT
  });
});

const mcpServer = new MCPServer(notificationService);

async function startServer(): Promise<void> {
  try {
    await mcpServer.start();
    
    app.listen(PORT, () => {
      const baseUrl = NGROK_DOMAIN ? `https://${NGROK_DOMAIN}` : `http://localhost:${PORT}`;
      console.log(`Server running on port ${PORT}`);
      console.log(`Access URL: ${baseUrl}`);
      console.log(`MCP server started successfully`);
      
      if (NGROK_DOMAIN) {
        console.log(`🌐 Using ngrok domain: ${NGROK_DOMAIN}`);
      } else {
        console.log('💡 Set NGROK_DOMAIN environment variable to use ngrok');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();