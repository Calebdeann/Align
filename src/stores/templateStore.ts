import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ImageSourcePropType } from 'react-native';
import { createUserNamespacedStorage } from '@/lib/userNamespacedStorage';
import { WorkoutImage } from './workoutStore';
import { PRESET_TEMPLATES } from './presetTemplates';
import { logger } from '@/utils/logger';

import {
  saveUserTemplate,
  updateUserTemplate,
  deleteUserTemplate,
  getUserTemplates,
  lookupExerciseImageUrls,
} from '@/services/api/templates';

// Template set structure
export interface TemplateSet {
  setNumber: number;
  targetWeight?: number; // kg
  targetReps?: number;
  setType?: string; // 'normal' | 'warmup' | 'failure' | 'dropset'
}

// Template exercise structure
export interface TemplateExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscle: string;
  gifUrl?: string;
  thumbnailUrl?: string;
  sets: TemplateSet[];
  notes?: string;
  restTimerSeconds: number;
  supersetId?: number | null; // null = not in a superset, 1+ = superset group
}

// Main template structure
export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  image?: WorkoutImage;
  localImage?: ImageSourcePropType; // For preset templates with bundled images
  tagIds: string[]; // Multiple tags (e.g., ["bicep", "back"])
  tagColor: string; // Primary color for card display
  estimatedDuration: number; // in minutes
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: string; // 'Gym', 'Home', 'No Equipment'
  category?:
    | 'core'
    | 'glutes'
    | 'lower-body'
    | 'pull'
    | 'push'
    | 'upper-body'
    | 'at-home'
    | 'travel'
    | 'cardio'
    | 'rehab'; // For explore filter categories
  exercises: TemplateExercise[];
  isPreset: boolean; // true for explore library, false for user-created
  createdAt: string;
  userId?: string; // null for preset templates
  folderId?: string; // Folder this template belongs to (null = unfiled)
}

// Folder structure for organizing templates
export interface TemplateFolder {
  id: string;
  name: string;
  createdAt: string;
  isCollapsed: boolean; // Whether folder is collapsed in UI
}

// Template input for creating/updating
export type TemplateInput = Omit<WorkoutTemplate, 'id' | 'createdAt' | 'isPreset'>;

interface TemplateStore {
  // User's saved templates
  templates: WorkoutTemplate[];

  // Preset templates (explore library)
  presetTemplates: WorkoutTemplate[];

  // Folders for organizing templates
  folders: TemplateFolder[];

  // Loading state for sync
  isSyncing: boolean;
  lastSyncError: string | null;

  // Actions
  addTemplate: (template: WorkoutTemplate, tagColor?: string) => boolean;
  removeTemplate: (id: string) => void;
  createTemplate: (input: TemplateInput) => WorkoutTemplate;
  updateTemplate: (id: string, updates: Partial<TemplateInput>) => void;
  getTemplateById: (id: string) => WorkoutTemplate | undefined;
  getTemplatesForUser: (userId: string | null) => WorkoutTemplate[];
  isTemplateSaved: (presetId: string, userId: string | null) => boolean;
  updateTemplateFromWorkout: (templateId: string, exercises: TemplateExercise[]) => void;
  reorderTemplates: (reorderedTemplates: WorkoutTemplate[]) => void;

  // Folder actions
  createFolder: (name: string) => TemplateFolder;
  renameFolder: (folderId: string, newName: string) => void;
  deleteFolder: (folderId: string) => void;
  toggleFolderCollapsed: (folderId: string) => void;
  moveTemplateToFolder: (templateId: string, folderId: string | null) => void;
  reorderFolders: (reorderedFolders: TemplateFolder[]) => void;

  // Sync actions for backend persistence
  syncTemplatesFromBackend: (userId: string) => Promise<void>;
  saveTemplateToBackend: (userId: string, template: WorkoutTemplate) => Promise<boolean>;
  deleteTemplateFromBackend: (templateId: string) => Promise<boolean>;
}

// Generate a simple unique ID
const generateId = () => `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Default folder ID - this folder cannot be deleted
export const DEFAULT_FOLDER_ID = 'my-templates';
export const DEFAULT_FOLDER_NAME = 'My Templates';

// Generate folder ID
const generateFolderId = () => `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      templates: [],
      presetTemplates: PRESET_TEMPLATES,
      folders: [],
      isSyncing: false,
      lastSyncError: null,

      // Add a preset template to user's library (local only - no backend sync for presets)
      // Returns true if added, false if already exists
      addTemplate: (template, tagColor) => {
        const { templates } = get();
        const alreadyExists = templates.some(
          (t) => t.id === template.id || t.name === template.name
        );
        if (alreadyExists) return false;
        set((state) => ({
          templates: [
            ...state.templates,
            { ...template, isPreset: false, ...(tagColor ? { tagColor } : {}) },
          ],
        }));
        return true;
      },

      // Remove template from user's library (also removes from backend)
      removeTemplate: (id) => {
        const template = get().templates.find((t) => t.id === id);
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
        // If template has a userId, it was synced to backend - delete from there too
        if (template?.userId) {
          deleteUserTemplate(id).catch((err) => {
            logger.warn('Failed to delete template from backend', { error: err });
          });
        }
      },

      // Create a new user template (saves to backend if userId provided)
      createTemplate: (input) => {
        const state = get();

        // Auto-create "My Templates" folder if it doesn't exist and this is first template
        let folders = state.folders;
        const hasDefaultFolder = folders.some((f) => f.id === DEFAULT_FOLDER_ID);
        if (!hasDefaultFolder) {
          const defaultFolder: TemplateFolder = {
            id: DEFAULT_FOLDER_ID,
            name: DEFAULT_FOLDER_NAME,
            createdAt: new Date().toISOString(),
            isCollapsed: false,
          };
          folders = [defaultFolder, ...folders];
        }

        // If no folderId specified, put in default "My Templates" folder
        const folderId = input.folderId || DEFAULT_FOLDER_ID;

        const newTemplate: WorkoutTemplate = {
          ...input,
          id: generateId(),
          createdAt: new Date().toISOString(),
          isPreset: false,
          folderId,
        };
        set({
          templates: [...state.templates, newTemplate],
          folders,
        });

        // Save to backend if userId is provided
        if (input.userId) {
          saveUserTemplate(input.userId, input)
            .then((backendId) => {
              if (backendId) {
                // Update local template with backend ID, keep original local ID for lookups
                set((state) => ({
                  templates: state.templates.map((t) =>
                    t.id === newTemplate.id ? { ...t, id: backendId, _localId: newTemplate.id } : t
                  ),
                }));
              }
            })
            .catch((err) => {
              logger.warn('Failed to save template to backend', { error: err });
            });
        }

        return newTemplate;
      },

      // Update an existing template (also updates backend)
      updateTemplate: (id, updates) => {
        const template = get().templates.find((t) => t.id === id);
        set((state) => ({
          templates: state.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));

        // Cascade name/color/image changes to scheduled workouts that reference this template
        const cascadeUpdates: { name?: string; tagColor?: string; image?: WorkoutImage } = {};
        if (updates.name) cascadeUpdates.name = updates.name;
        if (updates.tagColor) cascadeUpdates.tagColor = updates.tagColor;
        if ('image' in updates) cascadeUpdates.image = updates.image;

        if (Object.keys(cascadeUpdates).length > 0) {
          // Use require() to avoid circular dependency between stores
          const { useWorkoutStore } = require('./workoutStore');
          useWorkoutStore.getState().updateScheduledWorkoutsForTemplate(id, cascadeUpdates);
        }

        // Update on backend if template was synced
        if (template?.userId) {
          // Strip client-only fields (localImage is not serializable for the backend)
          const { localImage, ...backendUpdates } = updates as any;
          updateUserTemplate(id, backendUpdates, backendUpdates.exercises).catch((err) => {
            logger.warn('Failed to update template on backend', { error: err });
          });
        }
      },

      // Get template by ID (checks both user and preset templates)
      // Also checks _localId to handle race condition when backend ID swap is in progress
      getTemplateById: (id) => {
        const { templates, presetTemplates } = get();
        return (
          templates.find((t) => t.id === id || (t as any)._localId === id) ||
          presetTemplates.find((t) => t.id === id)
        );
      },

      // Get all templates belonging to a specific user
      getTemplatesForUser: (userId) => {
        const { templates } = get();
        if (!userId) return [];
        return templates.filter((t) => t.userId === userId);
      },

      // Check if a preset template is saved in user's library
      isTemplateSaved: (presetId, userId) => {
        const { templates } = get();
        // Check if any user template was created from this preset by this user
        return templates.some(
          (t) =>
            t.userId === userId &&
            (t.id === presetId ||
              t.name === get().presetTemplates.find((p) => p.id === presetId)?.name)
        );
      },

      // Update template exercises from completed workout (also syncs to backend)
      updateTemplateFromWorkout: (templateId, exercises) => {
        const template = get().templates.find((t) => t.id === templateId);
        set((state) => ({
          templates: state.templates.map((t) => {
            if (t.id !== templateId) return t;
            return {
              ...t,
              exercises: exercises,
            };
          }),
        }));

        // Update on backend if template was synced
        if (template?.userId) {
          updateUserTemplate(templateId, {}, exercises).catch((err) => {
            logger.warn('Failed to update template exercises on backend', { error: err });
          });
        }
      },

      // Reorder templates (for drag-and-drop reordering)
      reorderTemplates: (reorderedTemplates) => {
        set({ templates: reorderedTemplates });
      },

      // Create a new folder
      createFolder: (name) => {
        const newFolder: TemplateFolder = {
          id: generateFolderId(),
          name,
          createdAt: new Date().toISOString(),
          isCollapsed: false,
        };
        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
        return newFolder;
      },

      // Rename a folder
      renameFolder: (folderId, newName) => {
        set((state) => ({
          folders: state.folders.map((f) => (f.id === folderId ? { ...f, name: newName } : f)),
        }));
      },

      // Delete a folder (templates in folder become unfiled)
      // Note: The default "My Templates" folder cannot be deleted
      deleteFolder: (folderId) => {
        // Protect the default folder from deletion
        if (folderId === DEFAULT_FOLDER_ID) {
          logger.warn('Cannot delete the default "My Templates" folder');
          return;
        }
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== folderId),
          templates: state.templates.map((t) =>
            t.folderId === folderId ? { ...t, folderId: DEFAULT_FOLDER_ID } : t
          ),
        }));
      },

      // Toggle folder collapsed state
      toggleFolderCollapsed: (folderId) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId ? { ...f, isCollapsed: !f.isCollapsed } : f
          ),
        }));
      },

      // Move template to a folder (or unfiled if folderId is null)
      moveTemplateToFolder: (templateId, folderId) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === templateId ? { ...t, folderId: folderId || undefined } : t
          ),
        }));
      },

      // Reorder folders (for drag-and-drop reordering)
      reorderFolders: (reorderedFolders) => {
        set({ folders: reorderedFolders });
      },

      // Sync templates from backend (fetch user's templates from Supabase)
      syncTemplatesFromBackend: async (userId) => {
        set({ isSyncing: true, lastSyncError: null });
        try {
          const backendTemplates = await getUserTemplates(userId);
          if (backendTemplates.length > 0) {
            // Backfill missing image URLs from exercises table
            const namesNeedingImages = new Set<string>();
            for (const tmpl of backendTemplates) {
              for (const ex of tmpl.exercises) {
                if (!ex.gifUrl && !ex.thumbnailUrl) {
                  namesNeedingImages.add(ex.exerciseName);
                }
              }
            }

            if (namesNeedingImages.size > 0) {
              const imageMap = await lookupExerciseImageUrls([...namesNeedingImages]);
              for (const tmpl of backendTemplates) {
                for (const ex of tmpl.exercises) {
                  if (!ex.gifUrl && !ex.thumbnailUrl) {
                    const urls = imageMap.get(ex.exerciseName);
                    if (urls) {
                      ex.gifUrl = urls.gifUrl;
                      ex.thumbnailUrl = urls.thumbnailUrl;
                    }
                  }
                }
              }
            }

            // Merge backend templates with local (backend takes precedence)
            set((state) => {
              const localOnlyTemplates = state.templates.filter(
                (local) => !backendTemplates.some((backend) => backend.id === local.id)
              );
              return {
                templates: [...backendTemplates, ...localOnlyTemplates],
                isSyncing: false,
              };
            });
          } else {
            set({ isSyncing: false });
          }
        } catch (error: any) {
          logger.warn('Failed to sync templates from backend', { error });
          set({ isSyncing: false, lastSyncError: error?.message || 'Sync failed' });
        }
      },

      // Save a specific template to backend
      saveTemplateToBackend: async (userId, template) => {
        try {
          const backendId = await saveUserTemplate(userId, template);
          if (backendId) {
            // Update local template with backend ID and userId, keep local ID for lookups
            set((state) => ({
              templates: state.templates.map((t) =>
                t.id === template.id ? { ...t, id: backendId, userId, _localId: template.id } : t
              ),
            }));
            return true;
          }
          return false;
        } catch (error) {
          logger.warn('Failed to save template to backend', { error });
          return false;
        }
      },

      // Delete template from backend
      deleteTemplateFromBackend: async (templateId) => {
        try {
          const success = await deleteUserTemplate(templateId);
          if (success) {
            set((state) => ({
              templates: state.templates.filter((t) => t.id !== templateId),
            }));
          }
          return success;
        } catch (error) {
          logger.warn('Failed to delete template from backend', { error });
          return false;
        }
      },
    }),
    {
      name: 'template-store',
      storage: createJSONStorage(() => createUserNamespacedStorage('template-store')),
      // Only persist user templates and folders, not preset templates (they're hardcoded)
      partialize: (state) => ({
        templates: state.templates,
        folders: state.folders,
      }),
      // Deduplicate templates on rehydration (fixes corrupted state from past bugs)
      onRehydrateStorage: () => (state) => {
        if (state) {
          const seen = new Set<string>();
          state.templates = state.templates.filter((t) => {
            if (seen.has(t.id)) return false;
            seen.add(t.id);
            return true;
          });
        }
      },
    }
  )
);

// Helper to calculate total sets in a template
export function getTemplateTotalSets(template: WorkoutTemplate): number {
  return template.exercises.reduce((total, ex) => total + ex.sets.length, 0);
}

// Helper to format duration for display
export function formatTemplateDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
