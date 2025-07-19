#!/bin/bash

echo "Setting up Cloudflare D1 databases for Personal Hub"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to extract database ID from wrangler output
extract_db_id() {
    echo "$1" | grep -o '"id": "[^"]*"' | sed 's/"id": "//; s/"//'
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: wrangler CLI is not installed${NC}"
    echo "Please install it with: npm install -g wrangler"
    exit 1
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}You need to login to Cloudflare${NC}"
    wrangler login
fi

echo "Creating databases..."
echo ""

# Create production database
echo "Creating production database..."
PROD_OUTPUT=$(wrangler d1 create personal-hub-db-production 2>&1)
if [[ $PROD_OUTPUT == *"already exists"* ]]; then
    echo -e "${YELLOW}Production database already exists${NC}"
    echo "Please get the ID from Cloudflare dashboard or use: wrangler d1 list"
else
    PROD_ID=$(extract_db_id "$PROD_OUTPUT")
    echo -e "${GREEN}Production database created!${NC}"
    echo "Database ID: $PROD_ID"
    echo ""
    echo "Update apps/backend/wrangler.toml with:"
    echo "database_id = \"$PROD_ID\""
fi

echo ""

# Create staging database
echo "Creating staging database..."
STAGING_OUTPUT=$(wrangler d1 create personal-hub-db-staging 2>&1)
if [[ $STAGING_OUTPUT == *"already exists"* ]]; then
    echo -e "${YELLOW}Staging database already exists${NC}"
    echo "Please get the ID from Cloudflare dashboard or use: wrangler d1 list"
else
    STAGING_ID=$(extract_db_id "$STAGING_OUTPUT")
    echo -e "${GREEN}Staging database created!${NC}"
    echo "Database ID: $STAGING_ID"
    echo ""
    echo "Update apps/backend/wrangler.toml with:"
    echo "database_id = \"$STAGING_ID\""
fi

echo ""
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Update the database IDs in apps/backend/wrangler.toml"
echo "2. Run migrations:"
echo "   cd apps/backend"
echo "   wrangler d1 migrations apply personal-hub-db-production --env production"
echo "   wrangler d1 migrations apply personal-hub-db-staging --env staging"
echo ""
echo "3. Commit the updated wrangler.toml file"