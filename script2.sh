#!/bin/bash

# ====== CONFIG ======
HOST="192.168.235.154:7042"
USERNAME="MOI_User"
# ====================

# Check if password is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <password>"
  exit 1
fi

PASSWORD="$1"

# Array of protocols to test
protocols=("https" "http")

for proto in "${protocols[@]}"; do
  URL="$proto://$HOST/api/Auth/token"
  echo "Testing $URL"
  echo "----------------------------------"

  response=$(curl -k -s -w "\nHTTP_STATUS:%{http_code}" \
    -X POST "$URL" \
    -H "Content-Type: application/json" \
    -d "{
          \"username\": \"$USERNAME\",
          \"password\": \"$PASSWORD\"
        }")

  # Extract body and status
  body=$(echo "$response" | sed -e 's/HTTP_STATUS\:.*//g')
  status=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

  echo "HTTP Status: $status"
  echo "Response Body:"
  echo "$body"
  echo "----------------------------------"

  if [ "$status" -eq 200 ]; then
    echo "✅ $proto request successful"
  else
    echo "❌ $proto request failed"
  fi

  echo ""
done
