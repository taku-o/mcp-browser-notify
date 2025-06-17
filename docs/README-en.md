# MCP Browser Notify

A Model Context Protocol (MCP) application for sending web push notifications to users.

## Features

- 🔔 **Notification Registration**: Obtain push notification permissions through web browsers
- 📱 **Multi-Device Support**: Support for both desktop and mobile devices  
- 🚀 **Instant Notifications**: Send notifications via MCP tools
- 🛠️ **Management Functions**: Registration, removal, and listing capabilities

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Access `http://localhost:3000` in your browser to register notifications

## MCP Tools

This application provides 4 MCP tools:

- `send_notification`: Send notification to a specific subscription ID
- `send_notification_to_all`: Send broadcast notification to all registered devices
- `list_subscriptions`: List all active notification subscriptions
- `remove_subscription`: Remove a notification subscription

## Usage

1. Click "Allow Notifications" on the web page
2. Select "Allow" in the browser's notification permission dialog
3. After registration, you can send notifications via MCP tools
4. Test notifications are also available for verification

## Technology Stack

- **Backend**: Node.js + Express + TypeScript
- **Push Notifications**: web-push (VAPID)
- **MCP Integration**: @modelcontextprotocol/sdk
- **Frontend**: Vanilla JavaScript + Service Worker

## Environment Variables

```bash
# Optional: Use existing VAPID keys
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key

# Server configuration
PORT=3000

# Optional: Use ngrok for external access
NGROK_DOMAIN=your-ngrok-domain.ngrok.io
```

VAPID keys are automatically generated on first startup if not provided.

## ngrok Integration

### Method 1: Using ngrok.yml (Recommended)

1. Edit `ngrok.yml` in the project root:
```yaml
version: 3

agent:
  authtoken: your_ngrok_authtoken
  connect_timeout: 30s

endpoints:
- name: notify
  url: https://your-domain.ngrok-free.app
  upstream:
    url: 3000
```

2. Start ngrok with config:
```bash
ngrok start --config=/path/to/mcp-browser-notify/ngrok.yml notify
```

3. Set environment variable:
```bash
NGROK_DOMAIN=your-domain.ngrok-free.app npm run dev
```

### Method 2: Direct Command

1. Set up your ngrok account and domain
2. Set the `NGROK_DOMAIN` environment variable
3. Start ngrok: `ngrok http --domain=your-domain.ngrok.io 3000`
4. The application will automatically use the ngrok URL for notifications

## MCP Configuration

### For Cursor (mcp.json)

Create `.cursor/mcp.json`:

```json
{
  "mcp": {
    "servers": {
      "browser-notify": {
        "command": "node",
        "args": ["dist/index.js"],
        "cwd": "/path/to/mcp-browser-notify"
      }
    }
  }
}
```

### Example MCP Tool Usage

```javascript
// Send notification to specific subscription
await mcp.callTool('send_notification', {
  subscriptionId: 'subscription-id-here',
  message: 'Task completed!'
});

// Send notification to all subscribers
await mcp.callTool('send_notification_to_all', {
  message: 'System maintenance in 5 minutes'
});

// List all subscriptions
const subscriptions = await mcp.callTool('list_subscriptions', {});

// Remove a subscription
await mcp.callTool('remove_subscription', {
  subscriptionId: 'subscription-id-here'
});
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Run tests
npm test
```

## Docker Support

### Using Docker Compose (Recommended)

1. Build and start the container:
```bash
docker-compose up -d
```

2. View logs:
```bash
docker-compose logs -f browser-notify
```

3. Stop the container:
```bash
docker-compose down
```

### Using Docker directly

1. Build the image:
```bash
docker build -t browser-notify .
```

2. Run the container:
```bash
docker run -d \
  --name browser-notify-container \
  -p 3000:3000 \
  -e NODE_ENV=production \
  browser-notify
```

3. Stop and remove:
```bash
docker stop browser-notify-container
docker rm browser-notify-container
```

### Docker with Environment Variables

```bash
docker run -d \
  --name browser-notify-container \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e VAPID_PUBLIC_KEY=your_public_key \
  -e VAPID_PRIVATE_KEY=your_private_key \
  -e NGROK_DOMAIN=your-domain.ngrok-free.app \
  browser-notify
```

## Project Structure

- `src/index.ts`: Main server file (Express + MCP integration)
- `src/services/NotificationService.ts`: Web push notification management class
- `src/mcp/MCPServer.ts`: MCP server implementation
- `public/`: Static files for web browser
  - `index.html`: Notification registration web page
  - `app.js`: Frontend JavaScript
  - `sw.js`: Service Worker (for receiving push notifications)

## License

MIT