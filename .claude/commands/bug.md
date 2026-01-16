# /bug - Log a bug and create prevention rule

When something goes wrong, use this to document it and prevent it from happening again.

## Instructions

1. Ask for:
   - What broke (the problem)
   - Why it broke (root cause) - investigate if needed
   - How we fixed it (solution)

2. Extract a prevention rule from the fix

3. Add to .claude/bugs.md:
   - Add entry to Bug Log section
   - If critical, add to Critical Rules section

## Format to Add

```markdown
### [Today's Date] - [Category] - [Short Title]

**Problem:** [What broke]
**Root Cause:** [Why it broke]
**Solution:** [How we fixed it]
**Prevention Rule:** [Rule to follow in future]
```

## Categories

- Auth
- Supabase
- Navigation
- Styling
- State Management
- TypeScript
- Build/Deploy
- Other

## After Logging

- Confirm the bug has been logged
- Remind about the prevention rule
- Update CLAUDE.md if it's a critical pattern
