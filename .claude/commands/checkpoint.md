# /checkpoint - Save current progress

Save progress before ending a session so work can be resumed seamlessly.

## Instructions

1. Review what was accomplished this session
2. Identify what's still in progress
3. Note any blockers or open questions
4. List clear next steps

## Update .claude/current-task.md

```markdown
# Current Task

## What We're Building

[Current feature/screen/task]

## Status

- [x] Completed item 1
- [x] Completed item 2
- [ ] In progress item ← IN PROGRESS
- [ ] Pending item

## Context Needed

- Relevant files: [list key files]
- Decisions made: [any important decisions]

## Blockers/Questions

- [List any blockers]
- [List any open questions]

## Next Steps

1. [First thing to do next session]
2. [Second thing]
3. [Third thing]
```

## After Saving

- Confirm progress has been saved
- Tell user "Say 'continue' next session to pick up where we left off"
