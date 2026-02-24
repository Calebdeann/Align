import { supabase } from '../supabase';
import { logger } from '@/utils/logger';
import { Exercise } from './exercises';
import {
  CreateCustomExerciseSchema,
  CreateCustomExerciseInput,
} from '@/schemas/customExercise.schema';

// Fetch all custom exercises for the current user
export async function fetchCustomExercises(userId: string): Promise<Exercise[]> {
  try {
    const { data, error } = await supabase
      .from('custom_exercises')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      logger.warn('Error fetching custom exercises', { error });
      return [];
    }

    return (data || []).map(mapToExercise);
  } catch (error) {
    logger.warn('Error in fetchCustomExercises', { error });
    return [];
  }
}

// Create a new custom exercise
export async function createCustomExercise(
  input: CreateCustomExerciseInput
): Promise<Exercise | null> {
  const parsed = CreateCustomExerciseSchema.safeParse(input);
  if (!parsed.success) {
    logger.warn('Invalid custom exercise input', { errors: parsed.error.flatten() });
    return null;
  }

  const { userId, name, equipment, primaryMuscle, secondaryMuscles, imageUrl } = parsed.data;

  try {
    const { data, error } = await supabase
      .from('custom_exercises')
      .insert({
        user_id: userId,
        name: name,
        display_name: name,
        muscle_group: primaryMuscle,
        equipment: equipment !== 'none' ? [equipment] : [],
        secondary_muscles: secondaryMuscles,
        image_url: imageUrl || null,
        thumbnail_url: imageUrl || null,
      })
      .select()
      .single();

    if (error) {
      logger.warn('Error creating custom exercise', { error });
      return null;
    }

    return mapToExercise(data);
  } catch (error) {
    logger.warn('Error in createCustomExercise', { error });
    return null;
  }
}

// Upload a custom exercise image to Supabase Storage
export async function uploadCustomExerciseImage(
  userId: string,
  imageUri: string
): Promise<string | null> {
  try {
    const filePath = `${userId}/${Date.now()}.jpg`;

    const formData = new FormData();
    formData.append('', {
      uri: imageUri,
      name: 'exercise.jpg',
      type: 'image/jpeg',
    } as any);

    const { error: uploadError } = await supabase.storage
      .from('custom-exercise-images')
      .upload(filePath, formData, {
        contentType: 'multipart/form-data',
        upsert: true,
      });

    if (uploadError) {
      logger.warn('Error uploading custom exercise image', { error: uploadError });
      return null;
    }

    const { data } = supabase.storage.from('custom-exercise-images').getPublicUrl(filePath);

    return `${data.publicUrl}?t=${Date.now()}`;
  } catch (error) {
    logger.warn('Error in uploadCustomExerciseImage', { error });
    return null;
  }
}

// Map a custom_exercises row to the Exercise interface
function mapToExercise(row: any): Exercise {
  return {
    id: row.id,
    name: row.name,
    display_name: row.display_name,
    muscle_group: row.muscle_group,
    equipment: row.equipment,
    secondary_muscles: row.secondary_muscles,
    image_url: row.image_url,
    thumbnail_url: row.thumbnail_url || row.image_url,
    muscle: row.muscle_group,
    is_custom: true,
  };
}
