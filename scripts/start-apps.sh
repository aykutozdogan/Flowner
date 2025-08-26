#!/bin/bash

echo "🚀 Flowner Development Mode Starting..."

# Kill any existing processes on our ports
lsof -ti:5000,5174,5175 | xargs -r kill -9 2>/dev/null || true
pkill -f "vite\|node\|tsx" 2>/dev/null || true
sleep 3

echo "📦 Type checking shared packages..."
cd packages/shared-core && npm run type-check 2>/dev/null || true
cd ../shared-ui && npm run type-check 2>/dev/null || true
cd ../..

echo "⚙️ Starting Backend API (port 5000)..."
npm run dev &
API_PID=$!
sleep 5

echo "🔧 Starting Admin App (port 5174)..."
cd apps/admin-app
npm run dev &
ADMIN_PID=$!
cd ../..
sleep 3

echo "📱 Starting Portal App (port 5175)..."
cd apps/portal-app
npm run dev &
PORTAL_PID=$!
cd ../..
sleep 3

echo "✅ All services started successfully!"
echo ""
echo "🌐 Access URLs:"
echo "   Backend API: https://${REPLIT_SLUG}-${REPLIT_OWNER}.replit.dev/"
echo "   Admin Panel: https://${REPLIT_SLUG}-${REPLIT_OWNER}.replit.dev:5174/"
echo "   User Portal: https://${REPLIT_SLUG}-${REPLIT_OWNER}.replit.dev:5175/"
echo ""
echo "   Local URLs:"
echo "   API: http://localhost:5000"
echo "   Admin: http://localhost:5174"
echo "   Portal: http://localhost:5175"

# Keep processes alive
trap 'kill $API_PID $ADMIN_PID $PORTAL_PID 2>/dev/null' EXIT
wait