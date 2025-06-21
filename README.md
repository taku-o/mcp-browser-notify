# MCP Browser Notify

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

### Frontend Configuration
Update the configuration in `public/config.js` with your actual Firebase project settings and VAPID key:

```javascript
window.AppConfig = {
    // Firebase設定 - Firebase Consoleから取得
    firebase: {
        apiKey: "YOUR_API_KEY",
        authDomain: "your-project.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project.appspot.com",
        messagingSenderId: "123456789012",
        appId: "1:123456789012:web:abcdef1234567890abcdef"
    },

    // FCM VAPID公開鍵 - Firebase Consoleから取得
    vapidKey: "YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE",

    // その他の設定は通常変更不要
    // ...
};
```

#### Firebase設定を取得する方法:
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Go to Project Settings → General tab
3. In "Your apps" section, select your web app
4. Choose "Firebase SDK snippet" → "Config"
5. Copy the `firebaseConfig` object values

#### VAPID Key取得方法:
1. In Firebase Console, go to Project Settings → Cloud Messaging tab
2. Under "Web configuration", generate a new key pair or copy the existing "Key pair"
3. Use this key as the `vapidKey` value in `config.js`

**🎯 メリット**: 
- 環境依存の設定が一箇所に集約
- `index.html`, `sw.js`, `app.js`が自動的に設定を読み込み
- 設定変更時の更新箇所が1ファイルのみ

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

**Important Notes for Cursor:**
- Cursor's multi-root workspace ignores the `cwd` parameter
- Use absolute paths for both command and args
- Properly escape JSON strings in environment variables

#### Direct Node.js (Recommended)
```json
{
  "mcp": {
    "servers": {
      "browser-notify": {
        "command": "node",
        "args": ["/absolute/path/to/mcp-browser-notify/dist/index.js"],
        "env": {
          "FIREBASE_PROJECT_ID": "your-project-id",
          "FIREBASE_SERVICE_ACCOUNT_KEY": "{\"type\":\"service_account\",\"project_id\":\"your-project\",\"private_key\":\"-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n\",\"client_email\":\"firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com\"}",
          "SUPABASE_URL": "https://your-project.supabase.co",
          "SUPABASE_ANON_KEY": "your-anon-key"
        }
      }
    }
  }
}
```

#### Note: .env file limitations in MCP
**Important:** MCP environments typically do not read `.env` files automatically. Environment variables must be explicitly defined in the mcp.json configuration. The project includes dotenv support for direct Node.js execution, but MCP requires explicit env variable declaration.

#### Docker
```json
{
  "mcp": {
    "servers": {
      "browser-notify": {
        "command": "docker",
        "args": ["exec", "browser-notify-container", "node", "dist/index.js"]
      }
    }
  }
}
```

## 📱 Frontend Integration

The web interface supports:
- User ID management
- Firebase SDK integration
- FCM token generation
- Real-time notification handling

### iOS Safari Support

**Requirements for iOS Safari (iOS 16.4+):**
1. **PWA Installation Required**: iOS Safari only supports web push notifications when the app is installed as a PWA (Progressive Web App)
2. **HTTPS Connection**: Secure connection is required (except localhost)
3. **Installation Steps**:
   - Open the website in Safari on iOS
   - Tap the "Share" button (□↑)
   - Select "Add to Home Screen"
   - Launch the app from the home screen icon
   - Allow notifications when prompted in PWA mode

**Important Notes:**
- Web push notifications do NOT work in regular Safari browser on iOS
- The app must be launched from the home screen icon (PWA mode)
- iOS 16.4 or later is required
- The application automatically detects iOS Safari and displays installation instructions

## 🔍 Health Monitoring

Check application health:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/admin/stats
```


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

4. **iOS Safari "Unsupported Device" Error**
   - Ensure iOS 16.4 or later is being used
   - Install the app as PWA: Safari → Share → "Add to Home Screen"
   - Launch from home screen icon, not Safari browser
   - Allow notifications when prompted in PWA mode

5. **Firebase Service Account Key JSON Parse Error**
   - Ensure proper JSON escaping in mcp.json: `\"` for quotes, `\\n` for newlines
   - Verify no control characters in the JSON string
   - Consider using .env file instead of inline JSON in mcp.json
   - Check that private_key field has properly escaped newlines

6. **Cursor MCP Path Resolution Issues**
   - Use absolute paths in mcp.json args: `/full/path/to/dist/index.js`
   - Cursor ignores cwd parameter in multi-root workspaces
   - Ensure project is built: `npm run build` before MCP usage

7. **MCP Environment Variables Not Loading**
   - MCP environments do not automatically read `.env` files
   - Must explicitly define all environment variables in mcp.json
   - Verify FIREBASE_SERVICE_ACCOUNT_KEY is properly escaped as single-line JSON
   - Check that all required variables are present: FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT_KEY, SUPABASE_URL, SUPABASE_ANON_KEY

## 🔐 Security Notes

- Service account keys should be kept secure
- Use environment variables for all credentials
- Database row-level security (RLS) recommended for production

## License

MIT