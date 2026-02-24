export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      deleted_users: {
        Row: {
          deleted_at: string | null;
          deletion_reason: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          original_user_id: string;
          profile_data: Json | null;
        };
        Insert: {
          deleted_at?: string | null;
          deletion_reason?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          original_user_id: string;
          profile_data?: Json | null;
        };
        Update: {
          deleted_at?: string | null;
          deletion_reason?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          original_user_id?: string;
          profile_data?: Json | null;
        };
        Relationships: [];
      };
      exercise_muscles: {
        Row: {
          activation: string;
          created_at: string | null;
          exercise_id: string;
          id: string;
          muscle: string;
        };
        Insert: {
          activation?: string;
          created_at?: string | null;
          exercise_id: string;
          id?: string;
          muscle: string;
        };
        Update: {
          activation?: string;
          created_at?: string | null;
          exercise_id?: string;
          id?: string;
          muscle?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exercise_muscles_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      exercise_translations: {
        Row: {
          created_at: string | null;
          display_name: string | null;
          exercise_id: string;
          id: string;
          instructions_array: string[] | null;
          keywords: string[] | null;
          language: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          display_name?: string | null;
          exercise_id: string;
          id?: string;
          instructions_array?: string[] | null;
          keywords?: string[] | null;
          language: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          display_name?: string | null;
          exercise_id?: string;
          id?: string;
          instructions_array?: string[] | null;
          keywords?: string[] | null;
          language?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exercise_translations_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      exercises: {
        Row: {
          body_parts: string[] | null;
          category: string | null;
          created_at: string | null;
          display_name: string | null;
          equipment: string[] | null;
          exercise_db_id: string | null;
          exercise_type: string | null;
          id: string;
          image_url: string | null;
          instructions: string | null;
          instructions_array: string[] | null;
          keywords: string[] | null;
          muscle_group: string | null;
          name: string;
          popularity: number | null;
          secondary_muscles: string[] | null;
          target_muscles: string[] | null;
          thumbnail_url: string | null;
          video_url: string | null;
        };
        Insert: {
          body_parts?: string[] | null;
          category?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          equipment?: string[] | null;
          exercise_db_id?: string | null;
          exercise_type?: string | null;
          id?: string;
          image_url?: string | null;
          instructions?: string | null;
          instructions_array?: string[] | null;
          keywords?: string[] | null;
          muscle_group?: string | null;
          name: string;
          popularity?: number | null;
          secondary_muscles?: string[] | null;
          target_muscles?: string[] | null;
          thumbnail_url?: string | null;
          video_url?: string | null;
        };
        Update: {
          body_parts?: string[] | null;
          category?: string | null;
          created_at?: string | null;
          display_name?: string | null;
          equipment?: string[] | null;
          exercise_db_id?: string | null;
          exercise_type?: string | null;
          id?: string;
          image_url?: string | null;
          instructions?: string | null;
          instructions_array?: string[] | null;
          keywords?: string[] | null;
          muscle_group?: string | null;
          name?: string;
          popularity?: number | null;
          secondary_muscles?: string[] | null;
          target_muscles?: string[] | null;
          thumbnail_url?: string | null;
          video_url?: string | null;
        };
        Relationships: [];
      };
      onboarding_sessions: {
        Row: {
          age: number | null;
          anonymous_id: string;
          body_change_goal: string | null;
          created_at: string | null;
          energy_fluctuation: string | null;
          experience_level: string | null;
          goals: string[] | null;
          health_situation: string | null;
          height: number | null;
          id: string;
          linked_user_id: string | null;
          main_goal: string | null;
          main_obstacle: string | null;
          notifications_enabled: boolean | null;
          referral_source: string | null;
          reminder_time: string | null;
          skipped_fields: string[] | null;
          target_weight: number | null;
          training_location: string | null;
          tried_other_apps: string | null;
          units: string | null;
          updated_at: string | null;
          weight: number | null;
          workout_days: string[] | null;
          workout_frequency: number | null;
        };
        Insert: {
          age?: number | null;
          anonymous_id: string;
          body_change_goal?: string | null;
          created_at?: string | null;
          energy_fluctuation?: string | null;
          experience_level?: string | null;
          goals?: string[] | null;
          health_situation?: string | null;
          height?: number | null;
          id?: string;
          linked_user_id?: string | null;
          main_goal?: string | null;
          main_obstacle?: string | null;
          notifications_enabled?: boolean | null;
          referral_source?: string | null;
          reminder_time?: string | null;
          skipped_fields?: string[] | null;
          target_weight?: number | null;
          training_location?: string | null;
          tried_other_apps?: string | null;
          units?: string | null;
          updated_at?: string | null;
          weight?: number | null;
          workout_days?: string[] | null;
          workout_frequency?: number | null;
        };
        Update: {
          age?: number | null;
          anonymous_id?: string;
          body_change_goal?: string | null;
          created_at?: string | null;
          energy_fluctuation?: string | null;
          experience_level?: string | null;
          goals?: string[] | null;
          health_situation?: string | null;
          height?: number | null;
          id?: string;
          linked_user_id?: string | null;
          main_goal?: string | null;
          main_obstacle?: string | null;
          notifications_enabled?: boolean | null;
          referral_source?: string | null;
          reminder_time?: string | null;
          skipped_fields?: string[] | null;
          target_weight?: number | null;
          training_location?: string | null;
          tried_other_apps?: string | null;
          units?: string | null;
          updated_at?: string | null;
          weight?: number | null;
          workout_days?: string[] | null;
          workout_frequency?: number | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          age: number | null;
          avatar_url: string | null;
          body_change_goal: string | null;
          created_at: string | null;
          distance_unit: string | null;
          email: string | null;
          energy_fluctuation: string | null;
          experience_level: string | null;
          full_name: string | null;
          goals: string[] | null;
          health_situation: string | null;
          height: number | null;
          id: string;
          main_goal: string | null;
          main_obstacle: string | null;
          measurement_unit: string | null;
          name: string | null;
          notifications_enabled: boolean | null;
          referral_code: string | null;
          referral_source: string | null;
          referred_by: string | null;
          reminder_time: string | null;
          skipped_fields: string[] | null;
          target_weight: number | null;
          training_location: string | null;
          tried_other_apps: string | null;
          units: string | null;
          updated_at: string | null;
          weight: number | null;
          weight_unit: string | null;
          workout_days: string[] | null;
          workout_frequency: number | null;
        };
        Insert: {
          age?: number | null;
          avatar_url?: string | null;
          body_change_goal?: string | null;
          created_at?: string | null;
          distance_unit?: string | null;
          email?: string | null;
          energy_fluctuation?: string | null;
          experience_level?: string | null;
          full_name?: string | null;
          goals?: string[] | null;
          health_situation?: string | null;
          height?: number | null;
          id: string;
          main_goal?: string | null;
          main_obstacle?: string | null;
          measurement_unit?: string | null;
          name?: string | null;
          notifications_enabled?: boolean | null;
          referral_code?: string | null;
          referral_source?: string | null;
          referred_by?: string | null;
          reminder_time?: string | null;
          skipped_fields?: string[] | null;
          target_weight?: number | null;
          training_location?: string | null;
          tried_other_apps?: string | null;
          units?: string | null;
          updated_at?: string | null;
          weight?: number | null;
          weight_unit?: string | null;
          workout_days?: string[] | null;
          workout_frequency?: number | null;
        };
        Update: {
          age?: number | null;
          avatar_url?: string | null;
          body_change_goal?: string | null;
          created_at?: string | null;
          distance_unit?: string | null;
          email?: string | null;
          energy_fluctuation?: string | null;
          experience_level?: string | null;
          full_name?: string | null;
          goals?: string[] | null;
          health_situation?: string | null;
          height?: number | null;
          id?: string;
          main_goal?: string | null;
          main_obstacle?: string | null;
          measurement_unit?: string | null;
          name?: string | null;
          notifications_enabled?: boolean | null;
          referral_code?: string | null;
          referral_source?: string | null;
          referred_by?: string | null;
          reminder_time?: string | null;
          skipped_fields?: string[] | null;
          target_weight?: number | null;
          training_location?: string | null;
          tried_other_apps?: string | null;
          units?: string | null;
          updated_at?: string | null;
          weight?: number | null;
          weight_unit?: string | null;
          workout_days?: string[] | null;
          workout_frequency?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_referred_by_fkey';
            columns: ['referred_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      referrals: {
        Row: {
          created_at: string | null;
          id: string;
          referred_id: string;
          referrer_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          referred_id: string;
          referrer_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          referred_id?: string;
          referrer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'referrals_referred_id_fkey';
            columns: ['referred_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'referrals_referrer_id_fkey';
            columns: ['referrer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      template_exercises: {
        Row: {
          created_at: string;
          exercise_id: string;
          exercise_name: string;
          gif_url: string | null;
          id: string;
          muscle: string;
          notes: string | null;
          order_index: number;
          rest_timer_seconds: number;
          template_id: string;
          thumbnail_url: string | null;
        };
        Insert: {
          created_at?: string;
          exercise_id: string;
          exercise_name: string;
          gif_url?: string | null;
          id?: string;
          muscle: string;
          notes?: string | null;
          order_index?: number;
          rest_timer_seconds?: number;
          template_id: string;
          thumbnail_url?: string | null;
        };
        Update: {
          created_at?: string;
          exercise_id?: string;
          exercise_name?: string;
          gif_url?: string | null;
          id?: string;
          muscle?: string;
          notes?: string | null;
          order_index?: number;
          rest_timer_seconds?: number;
          template_id?: string;
          thumbnail_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'template_exercises_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'workout_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      template_sets: {
        Row: {
          created_at: string;
          id: string;
          set_number: number;
          target_reps: number | null;
          target_weight: number | null;
          template_exercise_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          set_number: number;
          target_reps?: number | null;
          target_weight?: number | null;
          template_exercise_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          set_number?: number;
          target_reps?: number | null;
          target_weight?: number | null;
          template_exercise_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'template_sets_template_exercise_id_fkey';
            columns: ['template_exercise_id'];
            isOneToOne: false;
            referencedRelation: 'template_exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      user_exercise_preferences: {
        Row: {
          created_at: string | null;
          exercise_id: string;
          id: string;
          rest_timer_seconds: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          exercise_id: string;
          id?: string;
          rest_timer_seconds?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          exercise_id?: string;
          id?: string;
          rest_timer_seconds?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_exercise_preferences_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_exercises: {
        Row: {
          created_at: string | null;
          exercise_id: string;
          exercise_muscle: string | null;
          exercise_name: string | null;
          id: string;
          notes: string | null;
          order_index: number;
          rest_timer_seconds: number | null;
          superset_id: number | null;
          workout_id: string;
        };
        Insert: {
          created_at?: string | null;
          exercise_id: string;
          exercise_muscle?: string | null;
          exercise_name?: string | null;
          id?: string;
          notes?: string | null;
          order_index?: number;
          rest_timer_seconds?: number | null;
          superset_id?: number | null;
          workout_id: string;
        };
        Update: {
          created_at?: string | null;
          exercise_id?: string;
          exercise_muscle?: string | null;
          exercise_name?: string | null;
          id?: string;
          notes?: string | null;
          order_index?: number;
          rest_timer_seconds?: number | null;
          superset_id?: number | null;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_exercises_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_exercises_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_muscles: {
        Row: {
          activation: string;
          created_at: string | null;
          id: string;
          muscle: string;
          total_sets: number;
          workout_id: string;
        };
        Insert: {
          activation: string;
          created_at?: string | null;
          id?: string;
          muscle: string;
          total_sets: number;
          workout_id: string;
        };
        Update: {
          activation?: string;
          created_at?: string | null;
          id?: string;
          muscle?: string;
          total_sets?: number;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_muscles_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_sets: {
        Row: {
          completed: boolean | null;
          created_at: string | null;
          id: string;
          reps: number | null;
          rpe: number | null;
          set_number: number;
          set_type: string | null;
          weight: number | null;
          workout_exercise_id: string;
        };
        Insert: {
          completed?: boolean | null;
          created_at?: string | null;
          id?: string;
          reps?: number | null;
          rpe?: number | null;
          set_number: number;
          set_type?: string | null;
          weight?: number | null;
          workout_exercise_id: string;
        };
        Update: {
          completed?: boolean | null;
          created_at?: string | null;
          id?: string;
          reps?: number | null;
          rpe?: number | null;
          set_number?: number;
          set_type?: string | null;
          weight?: number | null;
          workout_exercise_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_sets_workout_exercise_id_fkey';
            columns: ['workout_exercise_id'];
            isOneToOne: false;
            referencedRelation: 'workout_exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_templates: {
        Row: {
          category: string | null;
          created_at: string;
          description: string | null;
          difficulty: string;
          equipment: string;
          estimated_duration: number;
          id: string;
          image_template_id: string | null;
          image_type: string | null;
          image_uri: string | null;
          is_preset: boolean;
          name: string;
          tag_color: string;
          tag_ids: string[] | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          difficulty?: string;
          equipment?: string;
          estimated_duration?: number;
          id?: string;
          image_template_id?: string | null;
          image_type?: string | null;
          image_uri?: string | null;
          is_preset?: boolean;
          name: string;
          tag_color?: string;
          tag_ids?: string[] | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          difficulty?: string;
          equipment?: string;
          estimated_duration?: number;
          id?: string;
          image_template_id?: string | null;
          image_type?: string | null;
          image_uri?: string | null;
          is_preset?: boolean;
          name?: string;
          tag_color?: string;
          tag_ids?: string[] | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          duration_seconds: number | null;
          id: string;
          image_template_id: string | null;
          image_type: string | null;
          image_uri: string | null;
          name: string;
          notes: string | null;
          source_template_id: string | null;
          started_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          id?: string;
          image_template_id?: string | null;
          image_type?: string | null;
          image_uri?: string | null;
          name: string;
          notes?: string | null;
          source_template_id?: string | null;
          started_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          id?: string;
          image_template_id?: string | null;
          image_type?: string | null;
          image_uri?: string | null;
          name?: string;
          notes?: string | null;
          source_template_id?: string | null;
          started_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      archive_and_delete_user: {
        Args: { user_id_param: string };
        Returns: undefined;
      };
      delete_own_account: { Args: never; Returns: undefined };
      generate_referral_code: { Args: never; Returns: string };
      validate_referral_code: { Args: { code: string }; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
