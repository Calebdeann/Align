// Ascend API (ExerciseDB v1) - Free exercise database with GIFs
const ASCEND_API_BASE = 'https://www.ascendapi.com/api/v1';

export interface AscendExercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

interface AscendResponse<T> {
  success: boolean;
  data: T;
  metadata?: {
    totalExercises: number;
    totalPages: number;
    currentPage: number;
  };
}

// Helper to safely fetch JSON (handles rate limiting and different response formats)
async function safeFetch<T>(url: string, retries: number = 2): Promise<AscendResponse<T>> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      const text = await res.text();

      // Check if response is JSON (rate limited responses return HTML/text)
      if (text.startsWith('{') || text.startsWith('[')) {
        const parsed = JSON.parse(text);

        // Handle both formats: {success, data} or direct array
        if (Array.isArray(parsed)) {
          return { success: true, data: parsed as T };
        }

        // Standard format with success/data
        if (typeof parsed === 'object' && 'success' in parsed) {
          return parsed as AscendResponse<T>;
        }

        // Object without success property - wrap it
        return { success: true, data: parsed as T };
      }

      // Rate limited or error - retry after delay
      if (attempt < retries) {
        console.warn(`Ascend API rate limited (attempt ${attempt + 1}), retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }

      console.warn('Ascend API rate limited:', url.substring(0, 80));
      return { success: false, data: [] as T };
    } catch (err) {
      if (attempt < retries) {
        console.warn(`Ascend API error (attempt ${attempt + 1}), retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      console.error('Ascend API error:', err);
      return { success: false, data: [] as T };
    }
  }
  return { success: false, data: [] as T };
}

// Search exercises by query
export async function searchAscendExercises(
  query?: string,
  limit: number = 50
): Promise<AscendExercise[]> {
  const url = query
    ? `${ASCEND_API_BASE}/exercises/search?q=${encodeURIComponent(query)}&limit=${limit}`
    : `${ASCEND_API_BASE}/exercises?limit=${limit}`;

  const response = await safeFetch<AscendExercise[]>(url);
  return Array.isArray(response.data) ? response.data : [];
}

// Get exercises filtered by muscle
export async function getAscendExercisesByMuscle(
  muscle: string,
  limit: number = 50
): Promise<AscendExercise[]> {
  const url = `${ASCEND_API_BASE}/muscles/${encodeURIComponent(muscle)}/exercises?limit=${limit}`;
  const response = await safeFetch<AscendExercise[]>(url);
  return Array.isArray(response.data) ? response.data : [];
}

// Get exercises filtered by equipment
export async function getAscendExercisesByEquipment(
  equipment: string,
  limit: number = 50
): Promise<AscendExercise[]> {
  const url = `${ASCEND_API_BASE}/equipments/${encodeURIComponent(equipment)}/exercises?limit=${limit}`;
  const response = await safeFetch<AscendExercise[]>(url);
  return Array.isArray(response.data) ? response.data : [];
}

// Get exercises filtered by body part
export async function getAscendExercisesByBodyPart(
  bodyPart: string,
  limit: number = 50
): Promise<AscendExercise[]> {
  const url = `${ASCEND_API_BASE}/bodyparts/${encodeURIComponent(bodyPart)}/exercises?limit=${limit}`;
  const response = await safeFetch<AscendExercise[]>(url);
  return Array.isArray(response.data) ? response.data : [];
}

// Get all available muscles
export async function getAscendMuscles(): Promise<string[]> {
  const response = await safeFetch<{ name: string }[]>(`${ASCEND_API_BASE}/muscles`);
  return response.success ? response.data.map((m) => m.name) : [];
}

// Get all available equipment types
export async function getAscendEquipment(): Promise<string[]> {
  const response = await safeFetch<{ name: string }[]>(`${ASCEND_API_BASE}/equipments`);
  return response.success ? response.data.map((e) => e.name) : [];
}

// Get all available body parts
export async function getAscendBodyParts(): Promise<string[]> {
  const response = await safeFetch<{ name: string }[]>(`${ASCEND_API_BASE}/bodyparts`);
  return response.success ? response.data.map((b) => b.name) : [];
}
