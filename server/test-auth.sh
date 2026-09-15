#!/bin/bash
# Quick auth test: logs in, then uses the token to call /api/auth/me
# Usage: bash test-auth.sh

EMAIL="zmonsurat@gmail.com"
PASSWORD="beautiful/12"
BASE_URL="http://localhost:5000"

echo "Logging in..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "Login response:"
echo "$RESPONSE"
echo ""

# Extract the token using grep/sed (no jq dependency needed)
TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "Could not extract token — login may have failed. Check the response above."
  exit 1
fi

echo "Got token, calling /api/auth/me..."
curl -s "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN"
echo ""
