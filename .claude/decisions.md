# Architecture Decisions

Record of key technical decisions and their reasoning.

---

## ADR-001: Expo with Managed Workflow

**Date:** 2026-01-16
**Decision:** Use Expo managed workflow (not bare)
**Reasoning:** Faster development, EAS builds, less native config needed
**Trade-offs:** Less control over native code, but can eject if needed

---

## ADR-002: Zustand for State Management

**Date:** 2026-01-16
**Decision:** Zustand over Redux or Context
**Reasoning:**

- Minimal boilerplate
- No providers needed
- Great TypeScript support
- Perfect for medium-sized apps
  **Alternatives Considered:** Redux Toolkit (too heavy), React Context (not scalable)

---

## ADR-003: Expo Router for Navigation

**Date:** 2026-01-16
**Decision:** Expo Router over React Navigation
**Reasoning:**

- File-based routing is intuitive
- Native-like URL handling
- Built-in TypeScript support
- Matches Next.js mental model
  **Trade-offs:** Newer, less community resources

---

## ADR-004: Supabase for Backend

**Date:** 2026-01-16
**Decision:** Supabase for auth, database, and storage
**Reasoning:**

- All-in-one solution
- Great free tier
- Real-time subscriptions built-in
- PostgreSQL flexibility
  **Alternatives Considered:** Firebase (vendor lock-in), custom backend (too slow)

---

## ADR-005: TypeScript Strict Mode Relaxed

**Date:** 2026-01-16
**Decision:** Use TypeScript but with relaxed settings for beginner
**Reasoning:** User is learning TypeScript, strict mode would slow development
**Plan:** Gradually increase strictness as comfort grows

---

<!-- Add more ADRs as decisions are made -->
