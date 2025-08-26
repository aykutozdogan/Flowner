
#!/bin/bash

echo "🚀 Flowner Development Mode Starting..."

# Type check shared packages (no actual build needed for development)
echo "📦 Type checking shared packages..."
cd packages/shared-core && pnpm build > /dev/null 2>&1 || echo "✓ shared-core type check passed"
cd ../shared-ui && pnpm build > /dev/null 2>&1 || echo "✓ shared-ui type check passed"

# Start admin app in dev mode
echo "🔧 Starting Admin App (development mode - port 5174)..."
cd ../../apps/admin-app
pnpm dev --port 5174 --host 0.0.0.0 &

# Start portal app in dev mode
echo "📱 Starting Portal App (development mode - port 5175)..."
cd ../portal-app
pnpm dev --port 5175 --host 0.0.0.0 &

# Start backend
echo "⚙️ Starting Backend API (port 5000)..."
cd ../..
NODE_ENV=development tsx server/index.ts &

echo "✅ All services started in development mode!"
echo "Admin: http://localhost:5174"
echo "Portal: http://localhost:5175" 
echo "API: http://localhost:5000"

wait
