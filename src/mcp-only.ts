import 'dotenv/config';
import { NotificationService } from './services/NotificationService.js';
import { MCPServer } from './mcp/MCPServer.js';

async function startMcpOnly(): Promise<void> {
  try {
    console.error('🔧 Starting MCP Browser Notify in stdio mode...');
    
    const notificationService = new NotificationService();
    const mcpServer = new MCPServer(notificationService);
    
    await mcpServer.start();
    console.error('✅ MCP server started successfully (stdio mode)');
    
    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    console.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  }
}

startMcpOnly();