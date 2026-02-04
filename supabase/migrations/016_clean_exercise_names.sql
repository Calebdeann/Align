-- =============================================
-- CLEAN EXERCISE NAMES
-- 1. Remove "(male)" references (women-focused app)
-- 2. Fix capitalization after opening parentheses
-- =============================================

-- PART 1: Strip "(male)" (case-insensitive) from exercise names
-- Uses regex to also remove leading whitespace before the parenthetical

UPDATE exercises
SET name = TRIM(REGEXP_REPLACE(name, '\s*\(male\)', '', 'gi'))
WHERE name ~* '\(male\)';

UPDATE workout_exercises
SET exercise_name = TRIM(REGEXP_REPLACE(exercise_name, '\s*\(male\)', '', 'gi'))
WHERE exercise_name ~* '\(male\)';

UPDATE template_exercises
SET exercise_name = TRIM(REGEXP_REPLACE(exercise_name, '\s*\(male\)', '', 'gi'))
WHERE exercise_name ~* '\(male\)';

-- PART 2: Fix capitalization after opening parentheses
-- e.g., "(side Pov)" -> "(Side Pov)"

CREATE OR REPLACE FUNCTION pg_temp.fix_paren_caps(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT := input_text;
  i INT;
BEGIN
  FOR i IN 1..LENGTH(result) - 1 LOOP
    IF SUBSTRING(result FROM i FOR 1) = '(' THEN
      result := LEFT(result, i)
                || UPPER(SUBSTRING(result FROM i + 1 FOR 1))
                || SUBSTRING(result FROM i + 2);
    END IF;
  END LOOP;
  RETURN result;
END;
$$;

UPDATE exercises
SET name = pg_temp.fix_paren_caps(name)
WHERE name ~ '\([a-z]';

UPDATE workout_exercises
SET exercise_name = pg_temp.fix_paren_caps(exercise_name)
WHERE exercise_name ~ '\([a-z]';

UPDATE template_exercises
SET exercise_name = pg_temp.fix_paren_caps(exercise_name)
WHERE exercise_name ~ '\([a-z]';
