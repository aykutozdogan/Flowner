
#!/bin/bash

echo "🚀 Flowner Development Mode Starting..."

# Kill any existing processes
pkill -f "vite\|node" 2>/dev/null || true
sleep 2

echo "📦 Type checking shared packages..."
cd packages/shared-core && npm run type-check 2>/dev/null || true
cd ../shared-ui && npm run type-check 2>/dev/null || true
cd ../..

echo "🔧 Starting Admin App (development mode - port 5174)..."
cd apps/admin-app
VITE_HOST=0.0.0.0 npm run dev -- --host 0.0.0.0 --port 5174 &
ADMIN_PID=$!
cd ../..

echo "📱 Starting Portal App (development mode - port 5175)..."
cd apps/portal-app
VITE_HOST=0.0.0.0 npm run dev -- --host 0.0.0.0 --port 5175 &
PORTAL_PID=$!
cd ../..

echo "⚙️ Starting Backend API (port 5000)..."
npm run dev &
API_PID=$!

# Wait a moment for services to start
sleep 3

echo "✅ All services started in development mode!"
echo "Admin: http://localhost:5174"
echo "Portal: http://localhost:5175" 
echo "API: http://localhost:5000"

# Keep the script running
wait
