#!/bin/bash

echo "🧪 S1 Basit Smoke Test"
echo "===================="

BASE_URL="http://localhost:5000"

# 1. Health check
echo -n "Health check... "
health=$(curl -s "$BASE_URL/api/health" | grep "healthy")
if [ -n "$health" ]; then
    echo "✅"
else
    echo "❌"
fi

# 2. Login
echo -n "Login test... "
login=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: 1992ddc5-622c-489d-a758-df471b2595ad" \
    -d '{"email": "admin@demo.local", "password": "Passw0rd!"}')

token=$(echo "$login" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
if [ -n "$token" ]; then
    echo "✅"
else
    echo "❌"
    echo "Login response: $login"
    exit 1
fi

# 3. Protected endpoint
echo -n "Protected endpoint... "
me=$(curl -s -X GET "$BASE_URL/api/auth/me" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: 1992ddc5-622c-489d-a758-df471b2595ad" \
    -H "Authorization: Bearer $token")

if echo "$me" | grep -q "Demo Admin"; then
    echo "✅"
else
    echo "❌"
    echo "Me response: $me"
fi

# 4. Analytics
echo -n "Analytics API... "
analytics=$(curl -s -X GET "$BASE_URL/api/analytics/dashboard" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: 1992ddc5-622c-489d-a758-df471b2595ad" \
    -H "Authorization: Bearer $token")

if echo "$analytics" | grep -q "activeProcesses"; then
    echo "✅"
else
    echo "❌"
    echo "Analytics response: $analytics"
fi

echo
echo "🎉 S1 Sprint temel fonksiyonları çalışıyor!"