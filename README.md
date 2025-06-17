# MCP Browser Notify

A Model Context Protocol (MCP) application for sending web push notifications.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to register for notifications.

## 📚 Documentation

- [English Documentation](./docs/README-en.md)
- [日本語ドキュメント](./docs/README-ja.md)

## 🔧 MCP Tools

- `send_notification` - Send notification to specific subscription
- `send_notification_to_all` - Broadcast to all subscribers  
- `list_subscriptions` - List active subscriptions
- `remove_subscription` - Remove subscription

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

For Cursor, create `.cursor/mcp.json`:

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

## License

MIT