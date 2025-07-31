# Documentation Standards

This document outlines the best practices and standards for maintaining documentation in the Personal Hub project.

## Directory Structure

Documentation follows a numbered hierarchy for clear navigation:

```text
docs/
├── README.md                    # Main documentation index
├── DOCUMENTATION_STANDARDS.md   # This file
├── 01-getting-started/         # Onboarding and setup
├── 02-architecture/            # System design and architecture
├── 03-development/             # Development guides
├── 04-deployment/              # Deployment and operations
├── 05-api/                     # API reference
├── 06-testing/                 # Testing documentation
├── 07-migration/               # Migration guides
└── 99-archive/                 # Historical documentation
    ├── migration-summaries/    # Past migration records
    └── session-handovers/      # Development session notes
```

## Naming Conventions

1. **Directories**: Use lowercase with hyphens, prefixed with numbers for ordering
   - Good: `01-getting-started`, `05-api`
   - Bad: `GettingStarted`, `API_DOCS`

2. **Files**: Use UPPERCASE for top-level guides, lowercase for sub-documents
   - Good: `README.md`, `DEPLOYMENT.md`, `local-testing.md`
   - Bad: `readme.MD`, `DeploymentGuide.md`

3. **Images**: Use descriptive names with hyphens
   - Good: `architecture-overview.png`, `api-flow-diagram.svg`
   - Bad: `img1.png`, `diagram_final_v2.jpg`

## Content Guidelines

### Structure
- Start with a clear H1 title
- Include a brief introduction
- Use a table of contents for documents > 3 sections
- End with "Next Steps" or related links

### Writing Style
- Use active voice
- Keep sentences concise
- Include code examples where relevant
- Provide both "why" and "how"

### Code Examples
```markdown
\`\`\`bash
# Always include the language identifier
pnpm install
\`\`\`
```

## Best Practices

1. **Keep It Current**: Update documentation with code changes
2. **Be Specific**: Avoid vague instructions
3. **Show Don't Tell**: Use examples and diagrams
4. **Test Instructions**: Verify commands work as written
5. **Link Liberally**: Connect related documentation

## Documentation Types

### README Files
Each directory should have a README.md that:
- Explains the directory's purpose
- Lists contents with brief descriptions
- Links to key documents
- Provides navigation to related sections

### Guides
Step-by-step instructions should:
- State prerequisites clearly
- Number steps sequentially
- Include expected outcomes
- Provide troubleshooting tips

### Reference Documentation
API and technical references should:
- Use consistent formatting
- Include all parameters/options
- Provide usage examples
- Document error cases

## Archival Policy

Move documentation to `99-archive/` when:
- It describes deprecated features
- It covers completed migrations
- It's no longer relevant to current development
- It's historical reference material

Archive structure should mirror the original location for easy reference.

## Review Process

1. Documentation changes should be reviewed like code
2. Check for accuracy, clarity, and completeness
3. Verify all links and code examples
4. Ensure consistency with existing documentation

## Tools and Automation

- Use markdown linters for consistency
- Automate link checking in CI
- Generate API docs from code when possible
- Keep a documentation changelog