# GitHub Rulesets Configuration

This directory contains GitHub ruleset configurations for the personal-hub-cf project.

## Available Rulesets

### 1. Main Branch Protection (`main-branch-protection.json`)

Protects the main branch with the following rules:
- **Deletion Protection**: Prevents branch deletion
- **Pull Request Requirements**:
  - No approving reviews required (for solo development)
  - Dismiss stale reviews on new pushes
  - Require all conversation threads to be resolved
  - Enable automatic Copilot code review
  - Only allow squash merging (keeps history clean)
- **Status Checks**: Requires CI checks to pass before merging
- **Non-fast-forward Protection**: Prevents force pushes
- **Commit Signature**: Requires signed commits for enhanced security
- **Bypass**: Repository maintainers can bypass in pull requests only

### 2. Feature Branch Naming (`feature-branch-naming.json`)

A minimal ruleset for all non-main branches that:
- Applies to all branches except main
- Allows flexible branch creation and updates
- Can be extended later to enforce naming conventions

## How to Import Rulesets

1. Go to your repository settings on GitHub
2. Navigate to "Rules" → "Rulesets"
3. Click "New ruleset" → "Import a ruleset"
4. Upload the JSON file for the ruleset you want to import
5. Review and apply the ruleset

## Best Practices Implemented

These rulesets follow best practices for open-source projects:

1. **Protected Main Branch**: Ensures stability of the primary branch
2. **CI/CD Integration**: Requires tests to pass before merging
3. **Clean History**: Squash merging keeps the commit history readable
4. **Security**: Requires signed commits for authenticity
5. **Flexibility**: Allows maintainers to bypass rules when necessary
6. **Code Quality**: Enables GitHub Copilot code review for additional insights

## Customization

You can modify these rulesets based on your needs:
- Increase `required_approving_review_count` when you have collaborators
- Add specific branch naming patterns in the feature branch ruleset
- Add more required status checks as your CI/CD pipeline grows
- Adjust bypass permissions based on your team structure