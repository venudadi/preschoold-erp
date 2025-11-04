#!/bin/bash

# Force Migrations 045 and 046
# Safe to run multiple times

echo ""
echo "=========================================="
echo "🔧 FORCING MIGRATIONS 045 & 046"
echo "=========================================="
echo ""
echo "This will ensure migrations 045 and 046"
echo "are applied even if already tracked."
echo ""

cd /app/backend
node scripts/force_migrations_045_046.js

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Forced migrations completed successfully!"
else
    echo ""
    echo "❌ Forced migrations encountered errors (exit code: $EXIT_CODE)"
    exit $EXIT_CODE
fi
