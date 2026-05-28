-- =============================================
-- MIGRATION 050: Public workout details RPC
-- =============================================
-- Returns the full workout row + exercises (with sets) + muscle breakdown for
-- any workout where image_audience = 'everyone'. Bypasses RLS via SECURITY
-- DEFINER so the Discover feed detail view can render another user's public
-- workout (RLS otherwise restricts SELECT to the owning user).

CREATE OR REPLACE FUNCTION get_public_workout_details(p_workout_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'workout', to_jsonb(w.*),
    'exercises', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', we.id,
          'workout_id', we.workout_id,
          'exercise_id', we.exercise_id,
          'exercise_name', we.exercise_name,
          'exercise_muscle', we.exercise_muscle,
          'order_index', we.order_index,
          'superset_id', we.superset_id,
          'notes', we.notes,
          'thumbnail_url', COALESCE(e.thumbnail_url, ce.thumbnail_url),
          'image_url', COALESCE(e.image_url, ce.image_url),
          'sets', COALESCE((
            SELECT jsonb_agg(to_jsonb(ws.*) ORDER BY ws.set_number)
            FROM workout_sets ws
            WHERE ws.workout_exercise_id = we.id
          ), '[]'::jsonb)
        ) ORDER BY we.order_index
      )
      FROM workout_exercises we
      LEFT JOIN exercises e ON e.id = we.exercise_id
      LEFT JOIN custom_exercises ce ON ce.id = we.exercise_id
      WHERE we.workout_id = w.id
    ), '[]'::jsonb),
    'muscles', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'muscle', wm.muscle,
        'total_sets', wm.total_sets,
        'activation', wm.activation
      ))
      FROM workout_muscles wm
      WHERE wm.workout_id = w.id
    ), '[]'::jsonb)
  )
  INTO v_result
  FROM workouts w
  WHERE w.id = p_workout_id
    AND COALESCE(w.image_audience, 'everyone') = 'everyone';

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_workout_details(UUID) TO authenticated;
