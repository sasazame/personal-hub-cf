# Tailwind CSS v4 Migration Guide

## Current Issues with Tailwind CSS v4

### 1. Breaking Changes
- `@apply` directive is more restrictive in v4
- Custom utility classes using CSS variables need explicit definition
- PostCSS plugin moved to `@tailwindcss/postcss` package

### 2. Error Messages
```
Error: Cannot apply unknown utility class `border-border`
```

### 3. Root Causes
1. **CSS Variable Syntax Change**: v4 requires different syntax for colors using CSS variables
2. **@apply Restrictions**: Can't use @apply with dynamically generated utilities
3. **Build Process**: Different compilation process affects custom utilities

## Solutions

### Option 1: Fix v4 Configuration (Recommended for new projects)
1. Update CSS to use v4 syntax
2. Define explicit utility classes instead of using @apply
3. Update color definitions to include alpha channel support

### Option 2: Downgrade to v3 (Recommended for existing projects)
```bash
cd apps/frontend
pnpm remove tailwindcss @tailwindcss/postcss
pnpm add -D tailwindcss@^3.4.0 autoprefixer@^10.4.0 postcss@^8.4.0
```

Then update `postcss.config.js`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Option 3: Use Compatibility Mode
Create a separate CSS file without @apply and use explicit utility classes in components.

## Impact on E2E Tests
- CSS loading errors can cause E2E test failures
- Visual regression tests may fail due to styling differences
- Performance impact on test execution

## Recommendation
For this project, **downgrading to Tailwind CSS v3** is recommended because:
1. The codebase was originally written for v3
2. All existing components use v3 patterns
3. E2E tests expect v3 behavior
4. Migration effort to v4 is significant

## Migration Steps (if staying with v4)
1. Remove all @apply directives
2. Update color configuration
3. Create explicit utility classes
4. Update all component classes
5. Test thoroughly in all browsers