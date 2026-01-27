# Backend Protection Rules

Rules Claude MUST follow when modifying any file in `src/services/api/`, `src/schemas/`, or `supabase/migrations/`.

---

## Rule 1: Migrations Must Be Applied Before Relying on New Columns

When code references a new database column:

- The corresponding migration in `supabase/migrations/` MUST exist
- Remind the user to run `npm run db:push` to apply it
- NEVER assume a migration has been applied just because the file exists

## Rule 2: New Column References Must Have Fallback Paths

When adding code that uses new/optional database columns in INSERT or UPDATE:

- Always build a "base" object with only established columns
- Add new columns to a separate "extended" object
- If the insert/update fails with a schema error (PGRST204, PGRST301, or PostgreSQL 42xxx), retry with only the base object
- Use the `isSchemaError()` helper in `src/services/api/workouts.ts` for detection
- Log a warning (not an error) when falling back, so the user knows to apply the migration

## Rule 3: Core Operations Must Never Fail Due to Optional Features

These operations are critical and must ALWAYS succeed, even if optional feature columns are missing:

| Operation               | File                             | Function                 |
| ----------------------- | -------------------------------- | ------------------------ |
| Save completed workout  | `src/services/api/workouts.ts`   | `saveCompletedWorkout()` |
| Save user template      | `src/services/api/templates.ts`  | `saveUserTemplate()`     |
| Update user template    | `src/services/api/templates.ts`  | `updateUserTemplate()`   |
| Save user profile       | `src/services/api/user.ts`       | `updateUserProfile()`    |
| Save onboarding data    | `src/services/api/onboarding.ts` | `saveOnboardingField()`  |
| Link onboarding to user | `src/services/api/onboarding.ts` | `linkOnboardingToUser()` |

If an optional feature (images, RPE, new profile fields) causes one of these to fail, the operation MUST retry without the optional fields.

## Rule 4: Test After Schema Changes

After modifying any file in `src/services/api/` or `supabase/migrations/`:

1. Verify the affected save/update function can succeed without the new column
2. Verify it succeeds with the new column after migration is applied
3. Check that no INSERT or UPDATE unconditionally includes columns added after the initial table creation

## Rule 5: Conditional Column Pattern

When adding a new column to an existing table, follow this exact pattern:

```typescript
// GOOD: Base object + conditional extension with fallback
const baseInsert = {
  /* established columns only */
};
const fullInsert = { ...baseInsert };
if (someCondition) {
  fullInsert.new_column = value;
}

const { data, error } = await supabase.from('table').insert(fullInsert).select('id').single();

if (error && isSchemaError(error) && someCondition) {
  // Retry without the new column
  console.warn('Column not found (migration not applied). Retrying without new fields.');
  const { data: retry, error: retryError } = await supabase
    .from('table')
    .insert(baseInsert)
    .select('id')
    .single();
  // handle retry result...
}
```

```typescript
// BAD: Unconditional new column (crashes if migration not applied)
const insert = {
  established_column: value,
  new_column: newValue, // DANGER: crashes if column doesn't exist
};
```

## Rule 6: Migration Naming Convention

- Format: `NNN_description.sql`
- Example: `010_workout_image.sql`
- Always use `ADD COLUMN IF NOT EXISTS` for idempotency
- Always use `DROP COLUMN IF EXISTS` for removals
