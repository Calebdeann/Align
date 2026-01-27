import { supabase } from '../supabase';
import { WorkoutTemplate, TemplateExercise, TemplateSet } from '@/stores/templateStore';
import { WorkoutImage } from '@/stores/workoutStore';
import { CreateTemplateInputSchema, UpdateTemplateInputSchema } from '@/schemas/template.schema';

// UUID v4 format check — local template IDs like "template_123_abc" are not valid UUIDs
const isValidUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Detect schema errors (column not found, etc.) for backward-compatible fallback
function isSchemaError(error: any): boolean {
  if (!error?.code) return false;
  const code = String(error.code);
  return code === 'PGRST204' || code === 'PGRST301' || code.startsWith('42');
}

// =============================================
// TYPES - Database Schema for Templates
// =============================================

export interface DbWorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  image_type: 'template' | 'camera' | 'gallery' | null;
  image_uri: string | null;
  image_template_id: string | null;
  tag_ids: string[];
  tag_color: string;
  estimated_duration: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: string;
  is_preset: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbTemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  exercise_name: string;
  muscle: string;
  notes: string | null;
  rest_timer_seconds: number;
  order_index: number;
  gif_url?: string | null;
  thumbnail_url?: string | null;
  created_at: string;
}

export interface DbTemplateSet {
  id: string;
  template_exercise_id: string;
  set_number: number;
  target_weight: number | null;
  target_reps: number | null;
  created_at: string;
}

// =============================================
// SAVE USER TEMPLATE
// =============================================

export async function saveUserTemplate(
  userId: string,
  template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'isPreset'>
): Promise<string | null> {
  // Validate input before any database operations
  const parseResult = CreateTemplateInputSchema.safeParse({
    userId,
    name: template.name,
    description: template.description,
    image: template.image,
    tagIds: template.tagIds,
    tagColor: template.tagColor,
    estimatedDuration: template.estimatedDuration,
    difficulty: template.difficulty,
    equipment: template.equipment,
    exercises: template.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      muscle: ex.muscle,
      notes: ex.notes,
      restTimerSeconds: ex.restTimerSeconds,
      sets: ex.sets.map((s) => ({
        setNumber: s.setNumber,
        targetWeight: s.targetWeight,
        targetReps: s.targetReps,
      })),
    })),
  });

  if (!parseResult.success) {
    console.warn('Invalid template input:', parseResult.error.flatten());
    return null;
  }

  try {
    // 1. Insert the template record
    const { data: savedTemplate, error: templateError } = await supabase
      .from('workout_templates')
      .insert({
        user_id: userId,
        name: template.name,
        description: template.description || null,
        image_type: template.image?.type || null,
        image_uri: template.image?.uri || null,
        image_template_id: template.image?.templateId || null,
        tag_ids: template.tagIds,
        tag_color: template.tagColor,
        estimated_duration: template.estimatedDuration,
        difficulty: template.difficulty,
        equipment: template.equipment,
        is_preset: false,
      })
      .select('id')
      .single();

    if (templateError || !savedTemplate) {
      console.warn('Error saving template:', templateError);
      return null;
    }

    const templateId = savedTemplate.id;

    // 2. Insert template_exercises for each exercise
    for (let i = 0; i < template.exercises.length; i++) {
      const exercise = template.exercises[i];

      const baseExerciseInsert = {
        template_id: templateId,
        exercise_id: exercise.exerciseId,
        exercise_name: exercise.exerciseName,
        muscle: exercise.muscle,
        notes: exercise.notes || null,
        rest_timer_seconds: exercise.restTimerSeconds,
        order_index: i + 1,
      };
      const hasImageFields = !!(exercise.gifUrl || exercise.thumbnailUrl);
      const fullExerciseInsert = hasImageFields
        ? {
            ...baseExerciseInsert,
            gif_url: exercise.gifUrl || null,
            thumbnail_url: exercise.thumbnailUrl || null,
          }
        : baseExerciseInsert;

      let templateExercise: { id: string } | null = null;
      const { data: exData, error: exerciseError } = await supabase
        .from('template_exercises')
        .insert(fullExerciseInsert)
        .select('id')
        .single();

      if (exerciseError && hasImageFields && isSchemaError(exerciseError)) {
        console.warn(
          'Image columns not found in template_exercises. Retrying without image fields.'
        );
        const { data: retryData, error: retryError } = await supabase
          .from('template_exercises')
          .insert(baseExerciseInsert)
          .select('id')
          .single();
        if (retryError || !retryData) {
          console.warn('Error saving template exercise (retry):', retryError);
          continue;
        }
        templateExercise = retryData;
      } else if (exerciseError || !exData) {
        console.warn('Error saving template exercise:', exerciseError);
        continue;
      } else {
        templateExercise = exData;
      }

      // 3. Insert template_sets for this exercise
      const setsToInsert = exercise.sets.map((set) => ({
        template_exercise_id: templateExercise!.id,
        set_number: set.setNumber,
        target_weight: set.targetWeight ?? null,
        target_reps: set.targetReps ?? null,
      }));

      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase.from('template_sets').insert(setsToInsert);

        if (setsError) {
          console.warn('Error saving template sets:', setsError);
        }
      }
    }

    return templateId;
  } catch (error) {
    console.warn('Error in saveUserTemplate:', error);
    return null;
  }
}

// =============================================
// UPDATE USER TEMPLATE
// =============================================

export async function updateUserTemplate(
  templateId: string,
  updates: Partial<Omit<WorkoutTemplate, 'id' | 'createdAt' | 'isPreset'>>,
  exercises?: TemplateExercise[]
): Promise<boolean> {
  // Skip if templateId is a local-only ID (not yet synced to backend)
  if (!isValidUuid(templateId)) {
    console.warn('Skipping backend update for local template:', templateId);
    return false;
  }

  // Validate updates
  const parseResult = UpdateTemplateInputSchema.safeParse({
    name: updates.name,
    description: updates.description,
    image: updates.image,
    tagIds: updates.tagIds,
    tagColor: updates.tagColor,
    estimatedDuration: updates.estimatedDuration,
    difficulty: updates.difficulty,
    equipment: updates.equipment,
    exercises: exercises?.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      muscle: ex.muscle,
      notes: ex.notes,
      restTimerSeconds: ex.restTimerSeconds,
      sets: ex.sets.map((s) => ({
        setNumber: s.setNumber,
        targetWeight: s.targetWeight,
        targetReps: s.targetReps,
      })),
    })),
  });

  if (!parseResult.success) {
    console.warn('Invalid template update input:', parseResult.error.flatten());
    return false;
  }

  try {
    // 1. Update the template record
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.image !== undefined) {
      updateData.image_type = updates.image?.type || null;
      updateData.image_uri = updates.image?.uri || null;
      updateData.image_template_id = updates.image?.templateId || null;
    }
    if (updates.tagIds !== undefined) updateData.tag_ids = updates.tagIds;
    if (updates.tagColor !== undefined) updateData.tag_color = updates.tagColor;
    if (updates.estimatedDuration !== undefined)
      updateData.estimated_duration = updates.estimatedDuration;
    if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
    if (updates.equipment !== undefined) updateData.equipment = updates.equipment;

    const { error: updateError } = await supabase
      .from('workout_templates')
      .update(updateData)
      .eq('id', templateId);

    if (updateError) {
      console.warn('Error updating template:', updateError);
      return false;
    }

    // 2. If exercises are provided, replace all exercises
    if (exercises) {
      // First, delete existing exercises (cascade will delete sets)
      const { error: deleteError } = await supabase
        .from('template_exercises')
        .delete()
        .eq('template_id', templateId);

      if (deleteError) {
        console.warn('Error deleting old exercises:', deleteError);
        return false;
      }

      // Then insert new exercises
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];

        const baseExerciseInsert = {
          template_id: templateId,
          exercise_id: exercise.exerciseId,
          exercise_name: exercise.exerciseName,
          muscle: exercise.muscle,
          notes: exercise.notes || null,
          rest_timer_seconds: exercise.restTimerSeconds,
          order_index: i + 1,
        };
        const hasImageFields = !!(exercise.gifUrl || exercise.thumbnailUrl);
        const fullExerciseInsert = hasImageFields
          ? {
              ...baseExerciseInsert,
              gif_url: exercise.gifUrl || null,
              thumbnail_url: exercise.thumbnailUrl || null,
            }
          : baseExerciseInsert;

        let templateExercise: { id: string } | null = null;
        const { data: exData, error: exerciseError } = await supabase
          .from('template_exercises')
          .insert(fullExerciseInsert)
          .select('id')
          .single();

        if (exerciseError && hasImageFields && isSchemaError(exerciseError)) {
          console.warn(
            'Image columns not found in template_exercises. Retrying without image fields.'
          );
          const { data: retryData, error: retryError } = await supabase
            .from('template_exercises')
            .insert(baseExerciseInsert)
            .select('id')
            .single();
          if (retryError || !retryData) {
            console.warn('Error saving template exercise (retry):', retryError);
            continue;
          }
          templateExercise = retryData;
        } else if (exerciseError || !exData) {
          console.warn('Error saving template exercise:', exerciseError);
          continue;
        } else {
          templateExercise = exData;
        }

        // Insert sets for this exercise
        const setsToInsert = exercise.sets.map((set) => ({
          template_exercise_id: templateExercise!.id,
          set_number: set.setNumber,
          target_weight: set.targetWeight ?? null,
          target_reps: set.targetReps ?? null,
        }));

        if (setsToInsert.length > 0) {
          const { error: setsError } = await supabase.from('template_sets').insert(setsToInsert);

          if (setsError) {
            console.warn('Error saving template sets:', setsError);
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.warn('Error in updateUserTemplate:', error);
    return false;
  }
}

// =============================================
// DELETE USER TEMPLATE
// =============================================

export async function deleteUserTemplate(templateId: string): Promise<boolean> {
  // Skip if templateId is a local-only ID (not yet synced to backend)
  if (!isValidUuid(templateId)) {
    console.warn('Skipping backend delete for local template:', templateId);
    return true;
  }

  try {
    const { error } = await supabase.from('workout_templates').delete().eq('id', templateId);

    if (error) {
      console.warn('Error deleting template:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Error in deleteUserTemplate:', error);
    return false;
  }
}

// =============================================
// GET USER TEMPLATES
// =============================================

export async function getUserTemplates(userId: string): Promise<WorkoutTemplate[]> {
  try {
    // 1. Fetch templates
    const { data: templates, error: templatesError } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (templatesError || !templates) {
      console.warn('Error fetching templates:', templatesError);
      return [];
    }

    // 2. For each template, fetch exercises and sets
    const fullTemplates: WorkoutTemplate[] = [];

    for (const template of templates) {
      const { data: exercises, error: exercisesError } = await supabase
        .from('template_exercises')
        .select('*')
        .eq('template_id', template.id)
        .order('order_index', { ascending: true });

      if (exercisesError) {
        console.warn('Error fetching template exercises:', exercisesError);
        continue;
      }

      const templateExercises: TemplateExercise[] = [];

      for (const exercise of exercises || []) {
        const { data: sets, error: setsError } = await supabase
          .from('template_sets')
          .select('*')
          .eq('template_exercise_id', exercise.id)
          .order('set_number', { ascending: true });

        if (setsError) {
          console.warn('Error fetching template sets:', setsError);
        }

        const templateSets: TemplateSet[] = (sets || []).map((set) => ({
          setNumber: set.set_number,
          targetWeight: set.target_weight ?? undefined,
          targetReps: set.target_reps ?? undefined,
        }));

        templateExercises.push({
          id: exercise.id,
          exerciseId: exercise.exercise_id,
          exerciseName: exercise.exercise_name,
          muscle: exercise.muscle,
          gifUrl: exercise.gif_url ?? undefined,
          thumbnailUrl: exercise.thumbnail_url ?? undefined,
          notes: exercise.notes ?? undefined,
          restTimerSeconds: exercise.rest_timer_seconds,
          sets: templateSets,
        });
      }

      // Build image object if present
      let image: WorkoutImage | undefined;
      if (template.image_type && template.image_uri) {
        image = {
          type: template.image_type,
          uri: template.image_uri,
          templateId: template.image_template_id ?? undefined,
        };
      }

      fullTemplates.push({
        id: template.id,
        name: template.name,
        description: template.description ?? undefined,
        image,
        tagIds: template.tag_ids || [],
        tagColor: template.tag_color,
        estimatedDuration: template.estimated_duration,
        difficulty: template.difficulty,
        equipment: template.equipment,
        exercises: templateExercises,
        isPreset: template.is_preset,
        createdAt: template.created_at,
        userId: template.user_id,
      });
    }

    return fullTemplates;
  } catch (error) {
    console.warn('Error in getUserTemplates:', error);
    return [];
  }
}

// =============================================
// GET TEMPLATE BY ID
// =============================================

export async function getTemplateById(templateId: string): Promise<WorkoutTemplate | null> {
  try {
    // 1. Fetch template
    const { data: template, error: templateError } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      console.warn('Error fetching template:', templateError);
      return null;
    }

    // 2. Fetch exercises
    const { data: exercises, error: exercisesError } = await supabase
      .from('template_exercises')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index', { ascending: true });

    if (exercisesError) {
      console.warn('Error fetching template exercises:', exercisesError);
      return null;
    }

    const templateExercises: TemplateExercise[] = [];

    for (const exercise of exercises || []) {
      const { data: sets, error: setsError } = await supabase
        .from('template_sets')
        .select('*')
        .eq('template_exercise_id', exercise.id)
        .order('set_number', { ascending: true });

      if (setsError) {
        console.warn('Error fetching template sets:', setsError);
      }

      const templateSets: TemplateSet[] = (sets || []).map((set) => ({
        setNumber: set.set_number,
        targetWeight: set.target_weight ?? undefined,
        targetReps: set.target_reps ?? undefined,
      }));

      templateExercises.push({
        id: exercise.id,
        exerciseId: exercise.exercise_id,
        exerciseName: exercise.exercise_name,
        muscle: exercise.muscle,
        gifUrl: exercise.gif_url ?? undefined,
        thumbnailUrl: exercise.thumbnail_url ?? undefined,
        notes: exercise.notes ?? undefined,
        restTimerSeconds: exercise.rest_timer_seconds,
        sets: templateSets,
      });
    }

    // Build image object if present
    let image: WorkoutImage | undefined;
    if (template.image_type && template.image_uri) {
      image = {
        type: template.image_type,
        uri: template.image_uri,
        templateId: template.image_template_id ?? undefined,
      };
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description ?? undefined,
      image,
      tagIds: template.tag_ids || [],
      tagColor: template.tag_color,
      estimatedDuration: template.estimated_duration,
      difficulty: template.difficulty,
      equipment: template.equipment,
      exercises: templateExercises,
      isPreset: template.is_preset,
      createdAt: template.created_at,
      userId: template.user_id,
    };
  } catch (error) {
    console.warn('Error in getTemplateById:', error);
    return null;
  }
}

// =============================================
// BATCH LOOKUP EXERCISE IMAGE URLS
// =============================================

// Look up image URLs from the exercises table for exercises missing them.
// Returns a map of exerciseName -> { gifUrl, thumbnailUrl }
export async function lookupExerciseImageUrls(
  exerciseNames: string[]
): Promise<Map<string, { gifUrl?: string; thumbnailUrl?: string }>> {
  const result = new Map<string, { gifUrl?: string; thumbnailUrl?: string }>();
  if (exerciseNames.length === 0) return result;

  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('name, image_url, thumbnail_url')
      .in('name', exerciseNames);

    if (error || !data) {
      console.warn('Error looking up exercise image URLs:', error);
      return result;
    }

    for (const row of data) {
      result.set(row.name, {
        gifUrl: row.image_url ?? undefined,
        thumbnailUrl: row.thumbnail_url ?? undefined,
      });
    }
  } catch (error) {
    console.warn('Error in lookupExerciseImageUrls:', error);
  }

  return result;
}
