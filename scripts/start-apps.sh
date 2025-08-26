
#!/bin/bash

echo "🚀 Flowner Apps Starting..."

# Build shared packages first
echo "📦 Building shared packages..."
cd packages/shared-core && pnpm build
cd ../shared-ui && pnpm build

echo "⚙️ Starting Backend API (port 5000)..."
cd ../..
npm run dev &

# Wait for backend to start
sleep 5

# Build and start admin app in dev mode
echo "🔧 Starting Admin App (dev mode port 3001)..."
cd apps/admin-app
pnpm dev --port 3001 --host 0.0.0.0 &

# Build and start portal app in dev mode
echo "📱 Starting Portal App (dev mode port 3002)..."
cd ../portal-app
pnpm dev --port 3002 --host 0.0.0.0 &

echo "✅ All services started!"
echo "🌐 Replit Access URLs:"
echo "Admin: Open Webview and select port 3001"
echo "Portal: Open Webview and select port 3002"
echo "API: Main Repl URL (port 5000)"

wait
