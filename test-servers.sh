#!/bin/bash

echo "Testing backend server..."
curl -s http://localhost:8787/health | jq .

echo -e "\nTesting API v1 endpoint..."
curl -s http://localhost:8787/api/v1 | jq .

echo -e "\nTesting frontend server..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

echo -e "\n\nTesting login endpoint with invalid credentials..."
curl -s -X POST http://localhost:8787/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid@example.com","password":"wrongpassword"}' | jq .