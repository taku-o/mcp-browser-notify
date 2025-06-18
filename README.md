# MCP Browser Notify (FCM Edition)

A Model Context Protocol (MCP) application for sending web push notifications using Firebase Cloud Messaging (FCM).

## 🚀 Quick Start

### Prerequisites
1. **Firebase Project Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Cloud Messaging
   - Generate a service account key
   
2. **Supabase Database Setup**
   - Create a Supabase project at [Supabase](https://supabase.com/)
   - Create the subscriptions table (see Database Schema below)

### Environment Variables
Create a `.env` file:
```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Optional
PORT=3000
NGROK_DOMAIN=your-domain.ngrok-free.app
```

### Option A: Direct Node.js
```bash
npm install
npm run build
npm run dev
```

### Option B: Docker
```bash
docker-compose up -d
```

Visit `http://localhost:3000` to register for notifications.

## 🗄️ Database Schema

Create this table in your Supabase database:

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

## 🔧 MCP Tools

The FCM-based implementation provides 6 powerful tools:

### Core Notification Tools
- **`send_notification`** - Send notification to a specific user
  - Parameters: `userId`, `message`, `title` (optional)
  
- **`send_notification_to_all`** - Broadcast notification to all registered users
  - Parameters: `message`, `title` (optional)

### User Management Tools
- **`register_user`** - Register a new user with FCM token
  - Parameters: `userId`, `fcmToken`, `deviceType`, `deviceInfo` (optional)
  
- **`list_subscriptions`** - List active subscriptions with optional user filtering
  - Parameters: `userId` (optional)
  
- **`remove_subscription`** - Remove a specific subscription
  - Parameters: `subscriptionId`

### Statistics Tool
- **`get_user_stats`** - Get comprehensive statistics about users and subscriptions
  - Returns: user count, subscription count, device type breakdown

## 🌐 ngrok Support

Edit `ngrok.yml` and start with config:

```bash
ngrok start --config=./ngrok.yml notify
NGROK_DOMAIN=your-domain.ngrok-free.app npm run dev
```

## 🐳 Docker Support

```bash
docker-compose up -d
```

## ⚙️ MCP Configuration

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

## 🔄 Migration from v1.x

If you're upgrading from the VAPID-based version:

1. **Breaking Changes**:
   - VAPID endpoints are deprecated
   - New FCM-based registration required
   - Database persistence replaces in-memory storage

2. **Legacy Endpoint Support**:
   - Old endpoints return 410 (Gone) with migration instructions
   - Use new `/api/*` endpoints

3. **User Registration**:
   - Users must re-register with FCM tokens
   - User ID system replaces subscription ID management

## 📱 Frontend Integration

The web interface now supports:
- User ID management
- Firebase SDK integration
- FCM token generation
- Real-time notification handling

## 🔍 Health Monitoring

Check application health:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/admin/stats
```

## 📚 Documentation

- [English Documentation](./docs/README-en.md)
- [日本語ドキュメント](./docs/README-ja.md)

## 🐛 Troubleshooting

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

## 🔐 Security Notes

- Service account keys should be kept secure
- Use environment variables for all credentials
- Database row-level security (RLS) recommended for production

## License

MIT