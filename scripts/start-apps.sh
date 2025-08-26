
#!/bin/bash

echo "🚀 Flowner Apps Starting..."

# Build shared packages first
echo "📦 Building shared packages..."
cd packages/shared-core && pnpm build
cd ../shared-ui && pnpm build

# Build and start admin app
echo "🔧 Starting Admin App (port 5174)..."
cd ../../apps/admin-app
pnpm build
pnpm preview --port 5174 --host 0.0.0.0 &

# Build and start portal app  
echo "📱 Starting Portal App (port 5175)..."
cd ../portal-app
pnpm build
pnpm preview --port 5175 --host 0.0.0.0 &

# Start backend
echo "⚙️ Starting Backend API (port 5000)..."
cd ../..
npm run dev &

echo "✅ All services started!"
echo "Admin: http://localhost:5174"
echo "Portal: http://localhost:5175" 
echo "API: http://localhost:5000"

wait
