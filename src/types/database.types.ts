export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string;
          updated_at: string;
          value: string | null;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: string | null;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: string | null;
        };
        Relationships: [];
      };
      blocked_users: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
          id: string;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
          id?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blocked_users_blocked_id_fkey';
            columns: ['blocked_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocked_users_blocked_id_fkey';
            columns: ['blocked_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_onboarding_summary';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'blocked_users_blocker_id_fkey';
            columns: ['blocker_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocked_users_blocker_id_fkey';
            columns: ['blocker_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_onboarding_summary';
            referencedColumns: ['user_id'];
          },
        ];
      };
      custom_exercises: {
        Row: {
          created_at: string | null;
          display_name: string;
          equipment: string[] | null;
          id: string;
          image_url: string | null;
          muscle_group: string;
          name: string;
          secondary_muscles: string[] | null;
          thumbnail_url: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          display_name: string;
          equipment?: string[] | null;
          id?: string;
          image_url?: string | null;
          muscle_group: string;
          name: string;
          secondary_muscles?: string[] | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          display_name?: string;
          equipment?: string[] | null;
          id?: string;
          image_url?: string | null;
          muscle_group?: string;
          name?: string;
          secondary_muscles?: string[] | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
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
      friendships: {
        Row: {
          addressee_id: string;
          created_at: string;
          id: string;
          requester_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          addressee_id: string;
          created_at?: string;
          id?: string;
          requester_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          addressee_id?: string;
          created_at?: string;
          id?: string;
          requester_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'friendships_addressee_id_fkey';
            columns: ['addressee_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_addressee_id_fkey';
            columns: ['addressee_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_onboarding_summary';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'friendships_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_onboarding_summary';
            referencedColumns: ['user_id'];
          },
        ];
      };
      imported_workout_cache: {
        Row: {
          confidence: number;
          created_at: string | null;
          exercises: Json;
          id: string;
          platform: string;
          video_id: string;
          workout_name: string | null;
        };
        Insert: {
          confidence: number;
          created_at?: string | null;
          exercises: Json;
          id?: string;
          platform: string;
          video_id: string;
          workout_name?: string | null;
        };
        Update: {
          confidence?: number;
          created_at?: string | null;
          exercises?: Json;
          id?: string;
          platform?: string;
          video_id?: string;
          workout_name?: string | null;
        };
        Relationships: [];
      };
      legacy_align_onboarding: {
        Row: {
          archived_at: string;
          body_change_goal: string | null;
          email: string | null;
          energy_fluctuation: string | null;
          experience_level: string | null;
          goals: string[] | null;
          health_situation: string | null;
          main_goal: string | null;
          main_obstacle: string | null;
          referral_source: string | null;
          training_location: string | null;
          tried_other_apps: string | null;
          units: string | null;
          user_id: string;
          workout_frequency: number | null;
        };
        Insert: {
          archived_at?: string;
          body_change_goal?: string | null;
          email?: string | null;
          energy_fluctuation?: string | null;
          experience_level?: string | null;
          goals?: string[] | null;
          health_situation?: string | null;
          main_goal?: string | null;
          main_obstacle?: string | null;
          referral_source?: string | null;
          training_location?: string | null;
          tried_other_apps?: string | null;
          units?: string | null;
          user_id: string;
          workout_frequency?: number | null;
        };
        Update: {
          archived_at?: string;
          body_change_goal?: string | null;
          email?: string | null;
          energy_fluctuation?: string | null;
          experience_level?: string | null;
          goals?: string[] | null;
          health_situation?: string | null;
          main_goal?: string | null;
          main_obstacle?: string | null;
          referral_source?: string | null;
          training_location?: string | null;
          tried_other_apps?: string | null;
          units?: string | null;
          user_id?: string;
          workout_frequency?: number | null;
        };
        Relationships: [];
      };
      motivational_posts: {
        Row: {
          aspect_ratio: number;
          caption: string | null;
          created_at: string | null;
          display_order: number;
          id: string;
          storage_path: string;
        };
        Insert: {
          aspect_ratio: number;
          caption?: string | null;
          created_at?: string | null;
          display_order: number;
          id?: string;
          storage_path: string;
        };
        Update: {
          aspect_ratio?: number;
          caption?: string | null;
          created_at?: string | null;
          display_order?: number;
          id?: string;
          storage_path?: string;
        };
        Relationships: [];
      };
      onboarding_sessions: {
        Row: {
          achieve_goals: string[] | null;
          anonymous_id: string;
          challenges: string[] | null;
          created_at: string | null;
          id: string;
          ideal_day: string | null;
          linked_user_id: string | null;
          matched_buddy_index: number | null;
          name: string | null;
          plan_id: string | null;
          program_start_date: string | null;
          skipped_fields: string[] | null;
          traffic_source: string | null;
          updated_at: string | null;
          workout_days: string[] | null;
        };
        Insert: {
          achieve_goals?: string[] | null;
          anonymous_id: string;
          challenges?: string[] | null;
          created_at?: string | null;
          id?: string;
          ideal_day?: string | null;
          linked_user_id?: string | null;
          matched_buddy_index?: number | null;
          name?: string | null;
          plan_id?: string | null;
          program_start_date?: string | null;
          skipped_fields?: string[] | null;
          traffic_source?: string | null;
          updated_at?: string | null;
          workout_days?: string[] | null;
        };
        Update: {
          achieve_goals?: string[] | null;
          anonymous_id?: string;
          challenges?: string[] | null;
          created_at?: string | null;
          id?: string;
          ideal_day?: string | null;
          linked_user_id?: string | null;
          matched_buddy_index?: number | null;
          name?: string | null;
          plan_id?: string | null;
          program_start_date?: string | null;
          skipped_fields?: string[] | null;
          traffic_source?: string | null;
          updated_at?: string | null;
          workout_days?: string[] | null;
        };
        Relationships: [];
      };
      pokes: {
        Row: {
          created_at: string;
          id: string;
          message: string | null;
          pokee_id: string;
          poker_id: string;
          seen: boolean;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message?: string | null;
          pokee_id: string;
          poker_id: string;
          seen?: boolean;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string | null;
          pokee_id?: string;
          poker_id?: string;
          seen?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'pokes_pokee_id_fkey';
            columns: ['pokee_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pokes_pokee_id_fkey';
            columns: ['pokee_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_onboarding_summary';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'pokes_poker_id_fkey';
            columns: ['poker_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pokes_poker_id_fkey';
            columns: ['poker_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_onboarding_summary';
            referencedColumns: ['user_id'];
          },
        ];
      };
      profiles: {
        Row: {
          achieve_goals: string[] | null;
          age: number | null;
          app_version: string | null;
          avatar_url: string | null;
          bio: string | null;
          challenges: string[] | null;
          created_at: string | null;
          distance_unit: string | null;
          email: string | null;
          full_name: string | null;
          height: number | null;
          id: string;
          ideal_day: string | null;
          last_active_at: string | null;
          matched_buddy_index: number | null;
          measurement_unit: string | null;
          name: string | null;
          notifications_enabled: boolean | null;
          plan_id: string | null;
          program_start_date: string | null;
          referral_code: string | null;
          referred_by: string | null;
          reminder_time: string | null;
          skipped_fields: string[] | null;
          subscribed_at: string | null;
          subscription_status: string | null;
          target_weight: number | null;
          traffic_source: string | null;
          traits: Json | null;
          updated_at: string | null;
          weight: number | null;
          weight_unit: string | null;
          workout_days: string[] | null;
        };
        Insert: {
          achieve_goals?: string[] | null;
          age?: number | null;
          app_version?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          challenges?: string[] | null;
          created_at?: string | null;
          distance_unit?: string | null;
          email?: string | null;
          full_name?: string | null;
          height?: number | null;
          id: string;
          ideal_day?: string | null;
          last_active_at?: string | null;
          matched_buddy_index?: number | null;
          measurement_unit?: string | null;
          name?: string | null;
          notifications_enabled?: boolean | null;
          plan_id?: string | null;
          program_start_date?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          reminder_time?: string | null;
          skipped_fields?: string[] | null;
          subscribed_at?: string | null;
          subscription_status?: string | null;
          target_weight?: number | null;
          traffic_source?: string | null;
          traits?: Json | null;
          updated_at?: string | null;
          weight?: number | null;
          weight_unit?: string | null;
          workout_days?: string[] | null;
        };
        Update: {
          achieve_goals?: string[] | null;
          age?: number | null;
          app_version?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          challenges?: string[] | null;
          created_at?: string | null;
          distance_unit?: string | null;
          email?: string | null;
          full_name?: string | null;
          height?: number | null;
          id?: string;
          ideal_day?: string | null;
          last_active_at?: string | null;
          matched_buddy_index?: number | null;
          measurement_unit?: string | null;
          name?: string | null;
          notifications_enabled?: boolean | null;
          plan_id?: string | null;
          program_start_date?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          reminder_time?: string | null;
          skipped_fields?: string[] | null;
          subscribed_at?: string | null;
          subscription_status?: string | null;
          target_weight?: number | null;
          traffic_source?: string | null;
          traits?: Json | null;
          updated_at?: string | null;
          weight?: number | null;
          weight_unit?: string | null;
          workout_days?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_referred_by_fkey';
            columns: ['referred_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_referred_by_fkey';
            columns: ['referred_by'];
            isOneToOne: false;
            referencedRelation: 'v_user_onboarding_summary';
            referencedColumns: ['user_id'];
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
            foreignKeyName: 'referrals_referred_id_fkey';
            columns: ['referred_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_onboarding_summary';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'referrals_referrer_id_fkey';
            columns: ['referrer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'referrals_referrer_id_fkey';
            columns: ['referrer_id'];
            isOneToOne: false;
            referencedRelation: 'v_user_onboarding_summary';
            referencedColumns: ['user_id'];
          },
        ];
      };
      scheduled_workouts: {
        Row: {
          completed_dates: Json;
          created_at: string;
          date: string;
          description: string | null;
          end_date: string | null;
          excluded_dates: Json;
          id: string;
          image: Json | null;
          name: string;
          plan_id: string | null;
          program_workout_id: string | null;
          reminder: Json | null;
          repeat: Json;
          tag_color: string;
          tag_id: string | null;
          template_id: string | null;
          template_name: string | null;
          time: Json | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_dates?: Json;
          created_at?: string;
          date: string;
          description?: string | null;
          end_date?: string | null;
          excluded_dates?: Json;
          id?: string;
          image?: Json | null;
          name: string;
          plan_id?: string | null;
          program_workout_id?: string | null;
          reminder?: Json | null;
          repeat?: Json;
          tag_color?: string;
          tag_id?: string | null;
          template_id?: string | null;
          template_name?: string | null;
          time?: Json | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_dates?: Json;
          created_at?: string;
          date?: string;
          description?: string | null;
          end_date?: string | null;
          excluded_dates?: Json;
          id?: string;
          image?: Json | null;
          name?: string;
          plan_id?: string | null;
          program_workout_id?: string | null;
          reminder?: Json | null;
          repeat?: Json;
          tag_color?: string;
          tag_id?: string | null;
          template_id?: string | null;
          template_name?: string | null;
          time?: Json | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
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
          set_type: string;
          target_reps: number | null;
          target_weight: number | null;
          template_exercise_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          set_number: number;
          set_type?: string;
          target_reps?: number | null;
          target_weight?: number | null;
          template_exercise_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          set_number?: number;
          set_type?: string;
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
        Relationships: [];
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
          image_aspect_ratio: number | null;
          image_audience: string | null;
          image_template_id: string | null;
          image_type: string | null;
          image_uri: string | null;
          name: string;
          notes: string | null;
          source_template_id: string | null;
          started_at: string | null;
          title_customized: boolean;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          id?: string;
          image_aspect_ratio?: number | null;
          image_audience?: string | null;
          image_template_id?: string | null;
          image_type?: string | null;
          image_uri?: string | null;
          name: string;
          notes?: string | null;
          source_template_id?: string | null;
          started_at?: string | null;
          title_customized?: boolean;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          id?: string;
          image_aspect_ratio?: number | null;
          image_audience?: string | null;
          image_template_id?: string | null;
          image_type?: string | null;
          image_uri?: string | null;
          name?: string;
          notes?: string | null;
          source_template_id?: string | null;
          started_at?: string | null;
          title_customized?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      v_user_onboarding_summary: {
        Row: {
          age: number | null;
          align_archived_at: string | null;
          align_body_change: string | null;
          align_energy: string | null;
          align_experience: string | null;
          align_goals: string | null;
          align_health: string | null;
          align_main_goal: string | null;
          align_main_obstacle: string | null;
          align_referral_source: string | null;
          align_train_location: string | null;
          align_tried_others: string | null;
          align_units: string | null;
          align_workout_freq: number | null;
          email: string | null;
          height: number | null;
          it_girl_name: string | null;
          itgirl_buddy_idx: number | null;
          itgirl_challenges: string | null;
          itgirl_goals: string | null;
          itgirl_how_they_found_us: string | null;
          itgirl_lifestyle: string | null;
          itgirl_plan: string | null;
          itgirl_start_date: string | null;
          itgirl_workout_days: string | null;
          notifications_enabled: boolean | null;
          reminder_time: string | null;
          signed_up: string | null;
          target_weight: number | null;
          user_id: string | null;
          weight: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      archive_and_delete_user: {
        Args: { user_id_param: string };
        Returns: undefined;
      };
      delete_own_account: { Args: never; Returns: undefined };
      generate_referral_code: { Args: never; Returns: string };
      get_friends_with_activity: {
        Args: { p_user_id: string };
        Returns: {
          duration_seconds: number;
          friend_avatar: string;
          friend_id: string;
          friend_name: string;
          image_audience: string;
          image_uri: string;
          is_active: boolean;
          last_workout_at: string;
          volume_kg: number;
          workout_at: string;
          workout_id: string;
          workout_name: string;
        }[];
      };
      get_next_official_posts: {
        Args: { p_count: number; p_offset: number; p_viewer_id: string };
        Returns: {
          aspect_ratio: number;
          caption: string;
          display_order: number;
          id: string;
          storage_path: string;
        }[];
      };
      get_public_profile: {
        Args: { p_target_id: string; p_viewer_id: string };
        Returns: {
          avatar_url: string;
          bio: string;
          created_at: string;
          id: string;
          name: string;
          plan_id: string;
          traits: Json;
        }[];
      };
      get_public_workout_details: {
        Args: { p_workout_id: string };
        Returns: Json;
      };
      get_public_workout_photos: {
        Args: { p_cursor?: string; p_limit?: number; p_visibility?: string };
        Returns: {
          completed_at: string;
          image_aspect_ratio: number;
          image_uri: string;
          title_customized: boolean;
          user_avatar: string;
          user_id: string;
          user_name: string;
          workout_id: string;
          workout_name: string;
        }[];
      };
      get_public_workouts: {
        Args: { p_limit?: number; p_target_id: string; p_viewer_id: string };
        Returns: {
          completed_at: string;
          duration_seconds: number;
          id: string;
          image_uri: string;
          name: string;
        }[];
      };
      get_suggested_users: {
        Args: { p_limit?: number; p_user_id: string };
        Returns: {
          avatar_url: string;
          bio: string;
          id: string;
          name: string;
          traits: Json;
        }[];
      };
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
