# Development Checklist

This checklist ensures consistent quality and prevents common issues in the Personal Hub project.

## 🔍 Pre-Development

- [ ] Create feature branch from `origin/main`
- [ ] Review related existing code for patterns and conventions
- [ ] Check if similar features exist to maintain consistency
- [ ] Verify all dependencies are already in the project (don't add new ones without discussion)

## 📝 Documentation Changes

When making documentation-only changes:
- [ ] Use `[skip ci]` in commit message to skip CI pipeline
- [ ] Example: `docs: Update API documentation [skip ci]`
- [ ] Ensure markdown files follow project structure
- [ ] Update table of contents if adding new sections

## 🆕 New Feature Development

### Core Implementation
- [ ] Follow existing code patterns and conventions
- [ ] Use TypeScript strict mode compliance
- [ ] Add proper error handling and logging
- [ ] Implement loading states and error boundaries
- [ ] Add appropriate unit tests (target >80% coverage)

### Required Integrations
When adding new features, ensure updates to and cross-feature impacts are addressed (dashboard metrics, analytics events/queries, settings feature toggles and disabled states):

#### 1. Dashboard Integration
- [ ] Add feature metrics to dashboard if applicable
- [ ] Update dashboard statistics/counts
- [ ] Add relevant charts or visualizations
- [ ] Test dashboard performance with new data

#### 2. Analytics Integration
- [ ] Add tracking events for feature usage
- [ ] Update analytics queries to include new data
- [ ] Add feature-specific analytics views
- [ ] Ensure analytics performance remains optimal

#### 3. Settings (Feature Toggles)
- [ ] Add feature toggle in user settings
- [ ] Implement proper feature flag checking
- [ ] Ensure feature can be completely disabled
- [ ] Test both enabled and disabled states
- [ ] Update settings UI to include new toggle

### UI/UX Requirements

#### Theme Support (Critical - Common Issue!)
- [ ] **Light Mode**: Test all UI elements in light theme
- [ ] **Dark Mode**: Test all UI elements in dark theme
- [ ] Use semantic color tokens (not hardcoded colors)
  - ✅ Good: `bg-background`, `text-foreground`, `border-border`
  - ❌ Bad: `bg-white`, `text-black`, `border-gray-200`
- [ ] Check hover states in both themes
- [ ] Verify contrast ratios meet WCAG standards
- [ ] Test with system theme preference
 - [ ] Prefer theme tokens/classes over Tailwind `dark:` prefix; if `dark:` is used, ensure parity with semantic tokens and no visual drift

#### Internationalization (i18n) (Critical - Common Issue!)
- [ ] All user-facing text uses translation keys
- [ ] No hardcoded strings in components
- [ ] Add translations for both English and Japanese
- [ ] Use proper namespacing for translation keys
- [ ] Format dates/times according to locale
- [ ] Test with both language settings
- [ ] Check text overflow with longer translations

#### Responsive Design
- [ ] Test on mobile viewport (375px)
- [ ] Test on tablet viewport (768px)
- [ ] Test on desktop viewport (1920px)
- [ ] Ensure touch targets are 44x44px minimum
- [ ] Check horizontal scrolling issues

#### Accessibility
- [ ] Add proper ARIA labels
- [ ] Ensure keyboard navigation works
- [ ] Test with screen reader
- [ ] Maintain proper focus management
- [ ] Use semantic HTML elements

## 🐛 Bug Fixes

- [ ] Reproduce the issue locally
- [ ] Add test case that fails without the fix
- [ ] Implement minimal fix (don't refactor unrelated code)
- [ ] Verify fix doesn't break existing functionality
- [ ] Test edge cases around the fix

## 🔒 Security Considerations

- [ ] Validate all user inputs
- [ ] Use parameterized queries (no string concatenation)
- [ ] Implement proper authentication checks
- [ ] Add rate limiting where appropriate
- [ ] Never log sensitive information
- [ ] Use HTTPS for all external requests

## 🧪 Testing Requirements

### Before Committing
- [ ] Run `pnpm typecheck` - Must pass
- [ ] Run `pnpm lint` - Must pass
- [ ] Run `pnpm test` - Must pass
- [ ] Run `pnpm test:e2e` - Must pass for critical paths
- [ ] Run `pnpm build` - Must pass (build output verified in CI)

### Test Coverage
- [ ] Unit tests for new functions/components
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical user flows
  - [ ] Full E2E suite includes basic CRUD coverage for each feature (Todos, Notes, Moments, Events, Goals, Pomodoro)
- [ ] Error case testing
- [ ] Edge case testing

## 🚀 Pre-Deployment

### Quality Gates (Must Pass All)
- [ ] TypeScript compilation succeeds
- [ ] ESLint passes with no errors
- [ ] All unit tests pass
- [ ] Critical E2E tests pass
- [ ] Build completes successfully

### Performance Checks
- [ ] No unnecessary re-renders
- [ ] Proper memoization where needed
- [ ] Lazy loading for heavy components
- [ ] Optimized images and assets
- [ ] Bundle size impact < 50KB for features

### Database Migrations
- [ ] Migration files follow naming convention
- [ ] Migrations are idempotent
- [ ] Test rollback procedures
- [ ] Verify D1 compatibility
- [ ] Add proper indexes for new queries

## 📦 Pull Request

### PR Description
- [ ] Clear title following conventional commits
- [ ] Detailed description of changes
- [ ] Screenshots for UI changes
- [ ] Link to related issues
- [ ] Breaking changes clearly noted

### PR Checklist
- [ ] Self-review completed
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] No TODO comments without issues
- [ ] Documentation updated if needed

## 🎯 Common Issues to Avoid

Based on recent PR history, pay special attention to:

1. **D1 Migration Issues**
   - Always test migrations locally first
   - Avoid unsupported SQL features (transactions, certain syntax)
   - Ensure migrations work in CI environment

2. **Authentication Errors**
   - Verify CSRF token handling
   - Check session timeout behavior
   - Test with expired tokens

3. **API Endpoint Issues**
   - Always use `/api/v1` prefix
   - Ensure proper error responses
   - Validate request/response schemas

4. **Feature Toggle Problems**
   - Initialize feature states properly
   - Handle missing user settings gracefully
   - Test migration of existing users

5. **Dark Mode Bugs**
   - Never use fixed colors
   - Test all states (hover, active, disabled)
   - Check third-party component theming

6. **E2E Test Failures**
   - Avoid race conditions
   - Use proper wait strategies
   - Clean up test data properly

## 📋 Post-Deployment

- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify feature flags working
- [ ] Test in production environment
- [ ] Update documentation if needed

## 💡 Tips

- Always prefer editing existing files over creating new ones
- Use the command palette (Cmd/Ctrl+K) to quickly navigate
- Run `pnpm dev` to test changes in real-time
- Check `apps/backend/__tests__` for testing patterns
- Review similar PRs for implementation examples

---

**Remember**: This checklist helps maintain code quality and prevents rework. Skipping items often leads to PR rejections or production issues.
