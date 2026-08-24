#!/bin/bash
# Jurgi — Cron escalation paiements
# Appelle /api/cron/escalate toutes les 2 minutes
# Usage: ./scripts/cron-escalate.sh

BASE_URL="${JURGI_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-jurgi-cron-secret-2026}"

RESULT=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "x-cron-secret: $CRON_SECRET" \
  "$BASE_URL/api/cron/escalate")

echo "[$(date '+%Y-%m-%d %H:%M:%S')] escalate: HTTP $RESULT"
