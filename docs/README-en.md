# MCP Browser Notify

A Model Context Protocol (MCP) application for sending web push notifications to users using Firebase Cloud Messaging (FCM).

## Features

- 🔔 **Notification Registration**: Obtain FCM tokens and register users through web browsers
- 📱 **Multi-Device Support**: Support for both desktop and mobile devices
- 👤 **User Management**: User ID-based notification management
- 🚀 **Instant Notifications**: Send notifications via 6 MCP tools
- 🗄️ **Persistence**: Store registration data in Supabase database

## Prerequisites

### Firebase Project Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Cloud Messaging
3. Add a web app and obtain Firebase configuration
4. Generate a service account key

### Supabase Database Setup
1. Create a Supabase project at [Supabase](https://supabase.com/)
2. Create the following table:

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  fcm_token TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile')) DEFAULT 'desktop',
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_fcm_token ON subscriptions(fcm_token);
```

## Environment Variables

Create a `.env` file:
```bash
# Firebase Configuration (Required)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}

# Supabase Configuration (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Optional
PORT=3000
NGROK_DOMAIN=your-domain.ngrok-free.app
```

### Frontend Configuration
Update the configuration in `public/config.js` with your actual Firebase project settings and VAPID key:

```javascript
window.AppConfig = {
    // Firebase configuration - Get from Firebase Console
    firebase: {
        apiKey: "YOUR_API_KEY",
        authDomain: "your-project.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project.appspot.com",
        messagingSenderId: "123456789012",
        appId: "1:123456789012:web:abcdef1234567890abcdef"
    },

    // FCM VAPID public key - Get from Firebase Console
    vapidKey: "YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE",

    // Other settings usually don't need changes
    // ...
};
```

#### How to get Firebase configuration:
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Go to Project Settings → General tab
3. In "Your apps" section, select your web app
4. Choose "Firebase SDK snippet" → "Config"
5. Copy the `firebaseConfig` object values

#### How to get VAPID Key:
1. In Firebase Console, go to Project Settings → Cloud Messaging tab
2. Under "Web configuration", generate a new key pair or copy the existing "Key pair"
3. Use this key as the `vapidKey` value in `config.js`

**🎯 Benefits**: 
- Environment-dependent settings centralized in one place
- `index.html`, `sw.js`, and `app.js` automatically load configuration
- Only one file needs to be updated when settings change

## Quick Start

### Method A: Direct Node.js Execution

1. Install dependencies:
```bash
npm install
```

2. Build the application:
```bash
npm run build
```

3. Start development server:
```bash
npm run dev
```

4. Access `http://localhost:3000` in your browser to register notifications

### Method B: Using Docker

1. Start with Docker Compose:
```bash
docker-compose up -d
```

2. Access `http://localhost:3000` in your browser to register notifications

## MCP Tools

This application provides 6 powerful MCP tools:

### Core Notification Tools
- **`send_notification`**: Send notification to a specific user
  - Parameters: `userId`, `message`, `title` (optional)
- **`send_notification_to_all`**: Broadcast notification to all registered users
  - Parameters: `message`, `title` (optional)

### User Management Tools
- **`register_user`**: Register a new user with FCM token
  - Parameters: `userId`, `fcmToken`, `deviceType`, `deviceInfo` (optional)
- **`list_subscriptions`**: List active subscriptions with optional user filtering
  - Parameters: `userId` (optional)
- **`remove_subscription`**: Remove a specific subscription
  - Parameters: `subscriptionId`

### Statistics Tool
- **`get_user_stats`**: Get comprehensive statistics about users and subscriptions
  - Returns: user count, subscription count, device type breakdown

## Usage

1. Enter a user ID on the web page
2. Click "Allow Notifications"
3. Select "Allow" in the browser's notification permission dialog
4. FCM token is automatically obtained and saved to the database
5. Notifications can be sent via MCP tools

## Technology Stack

- **Backend**: Node.js + Express + TypeScript
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Database**: Supabase PostgreSQL
- **MCP Integration**: @modelcontextprotocol/sdk
- **Frontend**: Firebase SDK + Service Worker

## MCP Configuration

### For Cursor IDE (.cursor/mcp.json)

#### Direct Node.js
```json
{
  "mcp": {
    "servers": {
      "browser-notify": {
        "command": "node",
        "args": ["dist/index.js"],
        "cwd": "/path/to/mcp-browser-notify",
        "env": {
          "FIREBASE_PROJECT_ID": "your-project-id",
          "FIREBASE_SERVICE_ACCOUNT_KEY": "{\"type\":\"service_account\",...}",
          "SUPABASE_URL": "https://your-project.supabase.co",
          "SUPABASE_ANON_KEY": "your-anon-key"
        }
      }
    }
  }
}
```

#### Docker
```json
{
  "mcp": {
    "servers": {
      "browser-notify": {
        "command": "docker",
        "args": ["exec", "browser-notify-container", "node", "dist/index.js"],
        "cwd": "/path/to/mcp-browser-notify"
      }
    }
  }
}
```

## ngrok Integration

Edit `ngrok.yml` to configure remote access:

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

Start ngrok:
```bash
ngrok start --config=./ngrok.yml notify
NGROK_DOMAIN=your-domain.ngrok-free.app npm run dev
```

## Health Monitoring

Check application health:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/admin/stats
```

## Troubleshooting

### Common Issues

1. **Firebase Authentication Errors**
   - Verify FIREBASE_SERVICE_ACCOUNT_KEY is valid JSON
   - Check Firebase project permissions

2. **Supabase Connection Issues**
   - Verify SUPABASE_URL and SUPABASE_ANON_KEY
   - Ensure database schema is created

3. **FCM Token Issues**
   - Check Firebase project configuration in frontend
   - Verify web app is properly configured in Firebase Console

## Security Notes

- Keep service account keys secure
- Use environment variables for all credentials
- Database row-level security (RLS) recommended for production

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
  -e FIREBASE_PROJECT_ID=your-project-id \
  -e FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}' \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_ANON_KEY=your-anon-key \
  browser-notify
```

3. Stop and remove:
```bash
docker stop browser-notify-container
docker rm browser-notify-container
```

## Project Structure

- `src/index.ts`: Main server file (Express + MCP integration)
- `src/services/NotificationService.ts`: FCM-based notification management class
- `src/mcp/MCPServer.ts`: MCP server implementation
- `public/`: Static files for web browser
  - `index.html`: Notification registration web page
  - `app.js`: Frontend JavaScript
  - `sw.js`: Service Worker (for Firebase Messaging)

## Example MCP Tool Usage

```javascript
// Send notification to specific user
await mcp.callTool('send_notification', {
  userId: 'user123',
  message: 'Task completed!',
  title: 'Notification'
});

// Send notification to all users
await mcp.callTool('send_notification_to_all', {
  message: 'System maintenance in 5 minutes'
});

// Register a new user
await mcp.callTool('register_user', {
  userId: 'user123',
  fcmToken: 'fcm-token-here',
  deviceType: 'desktop'
});

// List all subscriptions
const subscriptions = await mcp.callTool('list_subscriptions', {});

// List subscriptions for specific user
const userSubs = await mcp.callTool('list_subscriptions', {
  userId: 'user123'
});

// Remove a subscription
await mcp.callTool('remove_subscription', {
  subscriptionId: 'subscription-id-here'
});

// Get statistics
const stats = await mcp.callTool('get_user_stats', {});
```

## License

MIT