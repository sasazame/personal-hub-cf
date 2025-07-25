#!/bin/bash

# Run migration on production D1 database
echo "Running migrations on production database..."

# Execute the migration file
wrangler d1 execute personal-hub-prod \
  --file=migrations/0000_low_proemial_gods.sql \
  --env=production

echo "Migration completed!"