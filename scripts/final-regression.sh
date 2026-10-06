#!/bin/bash
# Final regression: scheduled delivery, cron, cancel + refund.
set -e
BASE="http://localhost:3000"
echo "=== create scheduled card ==="
SC=$(curl -s -X POST $BASE/api/cards -H "Content-Type: application/json" -d '{"senderName":"Sched","recipientName":"Ann","occasion":"anniversary","message":"See you at the finish line."}')
SSLUG=$(echo "$SC" | python3 -c "import json,sys; print(json.load(sys.stdin)['slug'])")
STOK=$(echo "$SC" | python3 -c "import json,sys; print(json.load(sys.stdin)['editToken'])")
SID=$(echo "$SC" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
echo "card: $SSLUG"
PAST="2020-01-01T09:00:00.000Z"
curl -s -X POST $BASE/api/checkout -H "Content-Type: application/json" -d "{\"slug\":\"$SSLUG\",\"editToken\":\"$STOK\",\"recipientEmail\":\"ann@example.com\",\"deliverAt\":\"$PAST\"}" > /dev/null
echo "=== pay (backdated) ==="
curl -s -X POST $BASE/api/checkout/mock-complete -H "Content-Type: application/json" -d "{\"cardId\":\"$SID\",\"email\":\"sched@example.com\",\"editToken\":\"$STOK\"}" | python3 -c "import json,sys; d=json.load(sys.stdin); print('status after pay:', d['status'])"
echo "=== cron tick delivers it ==="
curl -s $BASE/api/cron/deliveries | python3 -m json.tool
echo "=== double cron (idempotent) ==="
curl -s $BASE/api/cron/deliveries | python3 -m json.tool
echo "=== cancel a delivered card should 409 ==="
curl -s -X POST $BASE/api/cards/$SSLUG/cancel -H "Content-Type: application/json" -d "{\"editToken\":\"$STOK\"}" -w "\nHTTP %{http_code}\n" | head -2
echo "=== new scheduled card, then cancel + refund ==="
SC2=$(curl -s -X POST $BASE/api/cards -H "Content-Type: application/json" -d '{"senderName":"Sched2","recipientName":"Bea","occasion":"birthday","message":"On ice until the day."}')
S2=$(echo "$SC2" | python3 -c "import json,sys; print(json.load(sys.stdin)['slug'])")
T2=$(echo "$SC2" | python3 -c "import json,sys; print(json.load(sys.stdin)['editToken'])")
I2=$(echo "$SC2" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
curl -s -X POST $BASE/api/checkout -H "Content-Type: application/json" -d "{\"slug\":\"$S2\",\"editToken\":\"$T2\",\"recipientEmail\":\"bea@example.com\",\"deliverAt\":\"2027-01-01T09:00:00.000Z\"}" > /dev/null
curl -s -X POST $BASE/api/checkout/mock-complete -H "Content-Type: application/json" -d "{\"cardId\":\"$I2\",\"email\":\"bea-buyer@example.com\",\"editToken\":\"$T2\"}" > /dev/null
echo "card status via API (maker view):"
curl -s "$BASE/api/cards?slug=$S2&editToken=$T2" | python3 -c "import json,sys; print('status:', json.load(sys.stdin)['status'])"
curl -s -X POST $BASE/api/cards/$S2/cancel -H "Content-Type: application/json" -d "{\"editToken\":\"$T2\"}" | python3 -m json.tool
echo "=== SSE endpoint smoke (expect stream headers) ==="
curl -s -m 3 -N "$BASE/api/cards/$SSLUG/events?editToken=$STOK" -o /dev/null -w "HTTP %{http_code} content-type: %{content_type}\n" || true
echo "ALL REGRESSION STEPS DONE"
