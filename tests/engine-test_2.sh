#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:5000/api"
TENANT="demo.local"

ADMIN_EMAIL="admin@demo.local"
ADMIN_PASS="Passw0rd!"
APPROVER_EMAIL="approver@demo.local"
APPROVER_PASS="Approver123!"

echo "🔐 Admin login..."
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" -H "X-Tenant-Id: $TENANT" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | jq -r '.data.access_token // .accessToken // .token')
if [[ -z "$ADMIN_TOKEN" || "$ADMIN_TOKEN" == "null" ]]; then
  echo "❌ Admin login başarısız"
  exit 1
fi
echo "✅ Admin login OK"

echo "📄 Workflow publish (expense_approval)..."
curl -s -X POST "$BASE_URL/workflows/expense_approval/publish" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "X-Tenant-Id: $TENANT" >/dev/null
echo "✅ Workflow publish OK"

echo "▶️ Process start (amount=750, auto approve)..."
P1=$(curl -s -X POST "$BASE_URL/processes/start" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "X-Tenant-Id: $TENANT" \
  -H "Content-Type: application/json" \
  -d '{"workflowKey":"expense_approval","variables":{"amount":750}}')

P1_ID=$(echo "$P1" | jq -r '.id // .processId')
sleep 2
STATUS1=$(curl -s "$BASE_URL/processes/$P1_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "X-Tenant-Id: $TENANT" | jq -r '.status')
if [[ "$STATUS1" == "completed" ]]; then
  echo "✅ Auto approve senaryosu geçti"
else
  echo "❌ Auto approve bekleniyordu, durum: $STATUS1"
  exit 1
fi

echo "▶️ Process start (amount=2500, approver task)..."
P2=$(curl -s -X POST "$BASE_URL/processes/start" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "X-Tenant-Id: $TENANT" \
  -H "Content-Type: application/json" \
  -d '{"workflowKey":"expense_approval","variables":{"amount":2500}}')

P2_ID=$(echo "$P2" | jq -r '.id // .processId')
echo "Process ID: $P2_ID"

echo "🔐 Approver login..."
APP_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" -H "X-Tenant-Id: $TENANT" \
  -d "{\"email\":\"$APPROVER_EMAIL\",\"password\":\"$APPROVER_PASS\"}")

APP_TOKEN=$(echo "$APP_LOGIN" | jq -r '.data.access_token // .accessToken // .token')
if [[ -z "$APP_TOKEN" || "$APP_TOKEN" == "null" ]]; then
  echo "❌ Approver login başarısız"
  exit 1
fi
echo "✅ Approver login OK"

echo "📋 Approver görevleri listeleniyor..."
TASKS=$(curl -s "$BASE_URL/tasks/my-tasks" \
  -H "Authorization: Bearer $APP_TOKEN" -H "X-Tenant-Id: $TENANT")
TASK_ID=$(echo "$TASKS" | jq -r '.[0].id // .[0].taskId')
if [[ -z "$TASK_ID" || "$TASK_ID" == "null" ]]; then
  echo "❌ Beklenen görev bulunamadı"
  exit 1
fi
echo "Görev bulundu: $TASK_ID"

echo "✅ Görev complete (approve)..."
curl -s -X POST "$BASE_URL/engine/tasks/$TASK_ID/complete" \
  -H "Authorization: Bearer $APP_TOKEN" -H "X-Tenant-Id: $TENANT" \
  -H "Content-Type: application/json" \
  -d '{"outcome":"approve","formData":{}}' >/dev/null

sleep 2
STATUS2=$(curl -s "$BASE_URL/processes/$P2_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "X-Tenant-Id: $TENANT" | jq -r '.status')
if [[ "$STATUS2" == "completed" ]]; then
  echo "✅ Approver senaryosu geçti"
else
  echo "❌ Approver senaryosu FAILED, durum: $STATUS2"
  exit 1
fi

echo "🎉 TÜM ENGINE TESTLERİ GEÇTİ"
exit 0
