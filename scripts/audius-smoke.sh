#!/usr/bin/env bash
# audius-smoke.sh — end-to-end smoke test for the Audius integration.
#
# Checks the four public catalog routes, the audio proxy (real bytes,
# corrected MIME), and the full card round-trip: a card created with an
# Audius song keeps its snapshot server-side.
#
# Usage:  ./scripts/audius-smoke.sh [base-url]
#         (defaults to http://127.0.0.1:3000)

set -euo pipefail
BASE="${1:-http://127.0.0.1:3000}"
PASS=0
FAIL=0

ok() { echo "  PASS  $1"; PASS=$((PASS + 1)); }
bad() { echo "  FAIL  $1"; FAIL=$((FAIL + 1)); }

echo "Audius smoke test against $BASE"

# 1. Trending returns a non-empty, well-shaped list.
TREND=$(curl -s "$BASE/api/audius/trending?limit=5")
echo "$TREND" | python3 -c "
import json, sys
d = json.load(sys.stdin)
tracks = d.get('tracks', [])
assert len(tracks) > 0, 'no trending tracks'
t = tracks[0]
for k in ('id', 'title', 'artist', 'duration'):
    assert k in t, f'missing field {k}'
assert isinstance(d.get('genres'), list) and d['genres'], 'no genres'
" && ok "trending: $(echo "$TREND" | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["tracks"]), "tracks")')" || bad "trending shape"

# 2. Search finds a known word.
curl -s "$BASE/api/audius/search?q=love&limit=3" | python3 -c "
import json, sys
d = json.load(sys.stdin)
assert len(d.get('tracks', [])) > 0, 'no search results'
" && ok "search" || bad "search returned nothing"

# 3. Short queries return empty without hitting the catalog.
S=$(curl -s "$BASE/api/audius/search?q=a")
[ "$S" = '{"tracks":[]}' ] && ok "short query short-circuits" || bad "short query leaked: $S"

# 4. Lucky returns a shuffled pool.
curl -s "$BASE/api/audius/lucky" | python3 -c "
import json, sys
d = json.load(sys.stdin)
assert 0 < len(d.get('tracks', [])) <= 12, 'lucky pool size off'
" && ok "lucky" || bad "lucky pool"

# 5. A real track resolves.
TR=$(curl -s "$BASE/api/audius/track/W6ENB")
echo "$TR" | python3 -c "
import json, sys
t = json.load(sys.stdin)['track']
assert t['id'] == 'W6ENB' and t['title'], 'track did not resolve'
" && ok "track resolve: $(echo "$TR" | python3 -c 'import json,sys; print(json.load(sys.stdin)["track"]["title"])')" || bad "track resolve"

# 6. The stream proxy serves real audio with a corrected MIME type.
MIME=$(curl -s -o /tmp/audius-smoke.mp3 --max-time 10 -w "%{content_type}" "$BASE/api/audius/stream/W6ENB")
case "$MIME" in
  audio/*) SIZE=$(wc -c < /tmp/audius-smoke.mp3); [ "$SIZE" -gt 10000 ] && ok "stream proxy: audio/${MIME#audio/}, ${SIZE} bytes" || bad "stream too small ($SIZE bytes)" ;;
  *) bad "stream MIME is $MIME, expected audio/*" ;;
esac
HEAD_BYTES=$(head -c 3 /tmp/audius-smoke.mp3)
[ "$HEAD_BYTES" = "ID3" ] && ok "stream is a real MP3 (ID3 header)" || bad "stream is not an MP3"

# 7. Bogus ids are rejected cleanly, not proxied.
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/audius/stream/not-a-real-id!!")
[ "$CODE" = "400" ] && ok "bogus id rejected (400)" || bad "bogus id gave $CODE"

# 8. Card round-trip: the song snapshot survives creation and reads back.
CREATE=$(curl -s -X POST "$BASE/api/cards" \
  -H "Content-Type: application/json" -H "Origin: $BASE" \
  -d '{"senderName":"Smoke","recipientName":"Test","occasion":"just-because","message":"One quick song check.","song":{"id":"W6ENB","title":"Love Story","artist":"Jijikita","artwork":"https://example.invalid/never-load.png","duration":202,"permalink":"https://audius.co/kitaurasyuji1/love-story"}}')
SLUG=$(echo "$CREATE" | python3 -c "import json,sys; print(json.load(sys.stdin)['slug'])")
TOK=$(echo "$CREATE" | python3 -c "import json,sys; print(json.load(sys.stdin)['editToken'])")
curl -s "$BASE/api/cards?slug=$SLUG&editToken=$TOK" | python3 -c "
import json, sys
d = json.load(sys.stdin)
s = d.get('song') or {}
assert d.get('songId') == 'W6ENB' and d.get('songProvider') == 'audius', 'song id/provider lost'
assert s.get('title') == 'Love Story' and s.get('artist') == 'Jijikita', 'snapshot fields lost'
assert s.get('duration') == 202, 'duration lost'
assert s.get('artwork', '').startswith('https://'), 'artwork not kept'
print('round trip ok')
" >/dev/null && ok "card song snapshot round-trip ($SLUG)" || bad "card song round-trip"

echo
echo "audius smoke: $PASS passed, $FAIL failed"
[ "$FAIL" = "0" ]
