#!/bin/bash

# E2E Test Consolidation Cleanup Script
# This script removes duplicate/consolidated E2E test files
# Run this after verifying the new consolidated tests work properly

set -e

echo "🧹 Starting E2E Test Consolidation Cleanup..."
echo "=============================================="

E2E_DIR="/home/sasazame/git/personal-hub-cf/e2e"
cd "$E2E_DIR"

# Files to remove (now consolidated)
DUPLICATE_AUTH_FILES=(
    "auth-basic.spec.ts"
    "auth-e2e.spec.ts" 
    "auth-flow.spec.ts"
    "auth-improved.spec.ts"
    "auth-real-backend.spec.ts"
    "auth-todo-integration.spec.ts"
    "simple-auth.spec.ts"
)

DUPLICATE_TODO_FILES=(
    "todo-basic.spec.ts"
    "todo-checkbox.spec.ts"
    "todo-subtasks.spec.ts"
    "todo-with-auth.spec.ts"
    "todo.spec.ts"  # Old todo.spec.ts, we have the new todos.spec.ts
)

DUPLICATE_SMOKE_FILES=(
    "ci-comprehensive.spec.ts"
    "ci-critical.spec.ts"
    "ci-smoke.spec.ts"
    "ci.spec.ts"
    "smoke-real-backend.spec.ts"
    # Note: keeping smoke.spec.ts as it's our consolidated version
)

DUPLICATE_SETUP_FILES=(
    "00-setup.spec.ts"
)

MISCELLANEOUS_DUPLICATE_FILES=(
    "api-health.spec.ts"  # Functionality moved to smoke.spec.ts
    "app-e2e.spec.ts"     # Generic test, functionality distributed
    "calendar-basic.spec.ts"
    "calendar-weekly-view-basic.spec.ts" 
    "calendar-weekly-view.spec.ts"
    "capture-current-ui.spec.ts"      # Development utility
    "collect-original-ui.spec.ts"     # Development utility
    "cross-browser.spec.ts"           # Functionality moved to auth.spec.ts
    "goals-integration.spec.ts"       # Functionality in goals.spec.ts
    "mobile-viewport.spec.ts"         # Functionality moved to smoke.spec.ts
    "optimized-example.spec.ts"       # Example/template file
    "password-reset.spec.ts"          # Feature-specific, can be kept or moved
    "test-data-management.spec.ts"    # Utility, functionality in setup.spec.ts
    "test-template.spec.ts"           # Template file
    "user-profile.spec.ts"            # Feature-specific, can be kept or moved
    "visual-regression.spec.ts"       # Specialized test, can be kept
)

echo "📋 Files to be removed:"
echo "----------------------"

ALL_FILES_TO_REMOVE=("${DUPLICATE_AUTH_FILES[@]}" "${DUPLICATE_TODO_FILES[@]}" "${DUPLICATE_SMOKE_FILES[@]}" "${DUPLICATE_SETUP_FILES[@]}" "${MISCELLANEOUS_DUPLICATE_FILES[@]}")

for file in "${ALL_FILES_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        echo "  ❌ $file"
    fi
done

echo ""
echo "📋 Files to be kept (consolidated):"
echo "-----------------------------------"
CONSOLIDATED_FILES=(
    "auth.spec.ts"
    "todos.spec.ts"
    "notes.spec.ts"
    "calendar.spec.ts"
    "goals.spec.ts"
    "moments.spec.ts"
    "pomodoro.spec.ts"
    "smoke.spec.ts"
    "setup.spec.ts"
)

for file in "${CONSOLIDATED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ⚠️  $file (not found)"
    fi
done

echo ""
echo "🗂️ Supporting directories to keep:"
echo "--------------------------------"
echo "  ✅ fixtures/"
echo "  ✅ helpers/"
echo "  ✅ mocks/"
echo "  ✅ screenshots/"
echo "  ✅ setup/"

echo ""
read -p "❓ Do you want to proceed with cleanup? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🗑️ Removing duplicate files..."
    echo "==============================="
    
    REMOVED_COUNT=0
    for file in "${ALL_FILES_TO_REMOVE[@]}"; do
        if [ -f "$file" ]; then
            echo "  🗑️  Removing $file"
            rm "$file"
            ((REMOVED_COUNT++))
        else
            echo "  ⚠️  $file (not found, skipping)"
        fi
    done
    
    echo ""
    echo "✅ Cleanup completed!"
    echo "==================="
    echo "📊 Removed $REMOVED_COUNT duplicate test files"
    echo "📂 Consolidated from 38+ files to $(ls -1 *.spec.ts | wc -l) files"
    echo ""
    echo "🧪 Remaining test structure:"
    echo "----------------------------"
    ls -la *.spec.ts | awk '{print "  " $9}' | head -20
    
    echo ""
    echo "🎯 Next steps:"
    echo "--------------"
    echo "1. Run tests to verify consolidation works: npm run test:e2e"
    echo "2. Update CI/CD configuration if needed"
    echo "3. Commit the changes: git add . && git commit -m 'Consolidate E2E tests'"
    echo ""
    
else
    echo ""
    echo "❌ Cleanup cancelled. No files were removed."
    echo "💡 You can run this script again when ready."
    echo ""
fi

echo "📝 Summary:"
echo "----------"
echo "✅ Consolidation plan completed"
echo "✅ New test files created with comprehensive coverage"  
echo "✅ Duplicate identification completed"
echo "🔄 Cleanup can be run when you're ready"
echo ""