export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assessment_cycles: {
        Row: {
          approval_end: string
          approval_start: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          review_end: string
          review_start: string
          status: Database["public"]["Enums"]["cycle_status"]
          submission_end: string
          submission_start: string
          tool_version_id: string
          updated_at: string
        }
        Insert: {
          approval_end: string
          approval_start: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          review_end: string
          review_start: string
          status?: Database["public"]["Enums"]["cycle_status"]
          submission_end: string
          submission_start: string
          tool_version_id: string
          updated_at?: string
        }
        Update: {
          approval_end?: string
          approval_start?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          review_end?: string
          review_start?: string
          status?: Database["public"]["Enums"]["cycle_status"]
          submission_end?: string
          submission_start?: string
          tool_version_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_cycles_tool_version_id_fkey"
            columns: ["tool_version_id"]
            isOneToOne: false
            referencedRelation: "tool_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_reviews: {
        Row: {
          assessment_id: string
          assigned_at: string
          assigned_by: string | null
          evaluator_id: string
          id: string
        }
        Insert: {
          assessment_id: string
          assigned_at?: string
          assigned_by?: string | null
          evaluator_id: string
          id?: string
        }
        Update: {
          assessment_id?: string
          assigned_at?: string
          assigned_by?: string | null
          evaluator_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_reviews_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_status_history: {
        Row: {
          assessment_id: string
          changed_at: string
          changed_by: string | null
          from_status: Database["public"]["Enums"]["assessment_status"] | null
          id: number
          note: string | null
          to_status: Database["public"]["Enums"]["assessment_status"]
        }
        Insert: {
          assessment_id: string
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["assessment_status"] | null
          id?: never
          note?: string | null
          to_status: Database["public"]["Enums"]["assessment_status"]
        }
        Update: {
          assessment_id?: string
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["assessment_status"] | null
          id?: never
          note?: string | null
          to_status?: Database["public"]["Enums"]["assessment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "assessment_status_history_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          approved_at: string | null
          created_at: string
          cycle_id: string
          id: string
          organization_id: string
          return_note: string | null
          returned_at: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          cycle_id: string
          id?: string
          organization_id: string
          return_note?: string | null
          returned_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          cycle_id?: string
          id?: string
          organization_id?: string
          return_note?: string | null
          returned_at?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "assessment_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      criterion_evaluations: {
        Row: {
          assignment_id: string
          criterion_id: string
          id: string
          notes: string | null
          score: number | null
          status: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          criterion_id: string
          id?: string
          notes?: string | null
          score?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          criterion_id?: string
          id?: string
          notes?: string | null
          score?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "criterion_evaluations_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "evaluator_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "criterion_evaluations_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "evaluation_criteria"
            referencedColumns: ["id"]
          },
        ]
      }
      delegates: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          id_number: string | null
          login_name: string | null
          mobile: string | null
          organization_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          id_number?: string | null
          login_name?: string | null
          mobile?: string | null
          organization_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          id_number?: string | null
          login_name?: string | null
          mobile?: string | null
          organization_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delegates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_criteria: {
        Row: {
          created_at: string
          criterion_name: string
          description: string | null
          id: string
          sort_order: number
          track_name: string
        }
        Insert: {
          created_at?: string
          criterion_name: string
          description?: string | null
          id?: string
          sort_order?: number
          track_name: string
        }
        Update: {
          created_at?: string
          criterion_name?: string
          description?: string | null
          id?: string
          sort_order?: number
          track_name?: string
        }
        Relationships: []
      }
      evaluation_evidences: {
        Row: {
          assignment_id: string
          criterion_id: string
          file_name: string
          file_url: string
          id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          assignment_id: string
          criterion_id: string
          file_name: string
          file_url: string
          id?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          assignment_id?: string
          criterion_id?: string
          file_name?: string
          file_url?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_evidences_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "evaluator_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_evidences_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "evaluation_criteria"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_messages: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_messages_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "evaluator_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluator_assignments: {
        Row: {
          assigned_at: string
          association_id: string
          completion_percentage: number
          evaluator_id: string
          id: string
          organization_id: string | null
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          assigned_at?: string
          association_id: string
          completion_percentage?: number
          evaluator_id: string
          id?: string
          organization_id?: string | null
          status?: string
          updated_at?: string
          year?: number
        }
        Update: {
          assigned_at?: string
          association_id?: string
          completion_percentage?: number
          evaluator_id?: string
          id?: string
          organization_id?: string | null
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluator_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluator_profiles: {
        Row: {
          created_at: string
          email: string | null
          employer: string | null
          full_name: string
          id_number: string | null
          is_active: boolean
          mobile: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          employer?: string | null
          full_name: string
          id_number?: string | null
          is_active?: boolean
          mobile?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          employer?: string | null
          full_name?: string
          id_number?: string | null
          is_active?: boolean
          mobile?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      evidences: {
        Row: {
          assessment_id: string
          file_name: string | null
          id: string
          item_id: string
          kind: Database["public"]["Enums"]["evidence_kind"]
          mime_type: string | null
          size_bytes: number | null
          storage_path: string | null
          uploaded_at: string
          uploaded_by: string
          url: string | null
        }
        Insert: {
          assessment_id: string
          file_name?: string | null
          id?: string
          item_id: string
          kind: Database["public"]["Enums"]["evidence_kind"]
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          uploaded_at?: string
          uploaded_by: string
          url?: string | null
        }
        Update: {
          assessment_id?: string
          file_name?: string | null
          id?: string
          item_id?: string
          kind?: Database["public"]["Enums"]["evidence_kind"]
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          uploaded_at?: string
          uploaded_by?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidences_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidences_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      indicators: {
        Row: {
          id: string
          number: number
          standard_id: string
          text: string
          tool_version_id: string
        }
        Insert: {
          id?: string
          number: number
          standard_id: string
          text: string
          tool_version_id: string
        }
        Update: {
          id?: string
          number?: number
          standard_id?: string
          text?: string
          tool_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicators_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicators_tool_version_id_fkey"
            columns: ["tool_version_id"]
            isOneToOne: false
            referencedRelation: "tool_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      item_responses: {
        Row: {
          assessment_id: string
          evaluator_note: string | null
          id: string
          is_met: boolean
          item_id: string
          org_note: string | null
          updated_at: string
          updated_by: string | null
          verified: boolean | null
        }
        Insert: {
          assessment_id: string
          evaluator_note?: string | null
          id?: string
          is_met?: boolean
          item_id: string
          org_note?: string | null
          updated_at?: string
          updated_by?: string | null
          verified?: boolean | null
        }
        Update: {
          assessment_id?: string
          evaluator_note?: string | null
          id?: string
          is_met?: boolean
          item_id?: string
          org_note?: string | null
          updated_at?: string
          updated_by?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "item_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_responses_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          id: string
          improvement_action: string
          indicator_id: string
          number: number
          opportunity_text: string
          strength_text: string
          text: string
          tool_version_id: string
        }
        Insert: {
          id?: string
          improvement_action: string
          indicator_id: string
          number: number
          opportunity_text: string
          strength_text: string
          text: string
          tool_version_id: string
        }
        Update: {
          id?: string
          improvement_action?: string
          indicator_id?: string
          number?: number
          opportunity_text?: string
          strength_text?: string
          text?: string
          tool_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_tool_version_id_fkey"
            columns: ["tool_version_id"]
            isOneToOne: false
            referencedRelation: "tool_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      level_bands: {
        Row: {
          id: string
          label: string
          level: number
          max_pct: number
          min_pct: number
          tool_version_id: string
        }
        Insert: {
          id?: string
          label: string
          level: number
          max_pct: number
          min_pct: number
          tool_version_id: string
        }
        Update: {
          id?: string
          label?: string
          level?: number
          max_pct?: number
          min_pct?: number
          tool_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_bands_tool_version_id_fkey"
            columns: ["tool_version_id"]
            isOneToOne: false
            referencedRelation: "tool_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_requests: {
        Row: {
          address: string | null
          city: string | null
          delegate_email: string | null
          delegate_id_number: string | null
          delegate_mobile: string | null
          delegate_name: string | null
          district: string | null
          email: string
          employees_count: number | null
          entity_type: Database["public"]["Enums"]["entity_type"] | null
          id: string
          notes: string | null
          organization_email: string | null
          organization_name: string
          region: string | null
          registration_date: string | null
          registration_number: string
          request_status: Database["public"]["Enums"]["request_status"]
          reviewed_at: string | null
          reviewed_by: string | null
          social_dev_center_id: string | null
          sub_classification_id: string | null
          submitted_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          delegate_email?: string | null
          delegate_id_number?: string | null
          delegate_mobile?: string | null
          delegate_name?: string | null
          district?: string | null
          email: string
          employees_count?: number | null
          entity_type?: Database["public"]["Enums"]["entity_type"] | null
          id?: string
          notes?: string | null
          organization_email?: string | null
          organization_name: string
          region?: string | null
          registration_date?: string | null
          registration_number: string
          request_status?: Database["public"]["Enums"]["request_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_dev_center_id?: string | null
          sub_classification_id?: string | null
          submitted_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          delegate_email?: string | null
          delegate_id_number?: string | null
          delegate_mobile?: string | null
          delegate_name?: string | null
          district?: string | null
          email?: string
          employees_count?: number | null
          entity_type?: Database["public"]["Enums"]["entity_type"] | null
          id?: string
          notes?: string | null
          organization_email?: string | null
          organization_name?: string
          region?: string | null
          registration_date?: string | null
          registration_number?: string
          request_status?: Database["public"]["Enums"]["request_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_dev_center_id?: string | null
          sub_classification_id?: string | null
          submitted_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_requests_social_dev_center_id_fkey"
            columns: ["social_dev_center_id"]
            isOneToOne: false
            referencedRelation: "social_dev_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_requests_sub_classification_id_fkey"
            columns: ["sub_classification_id"]
            isOneToOne: false
            referencedRelation: "sub_classifications"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          district: string | null
          email: string | null
          employees_count: number | null
          entity_type: Database["public"]["Enums"]["entity_type"] | null
          id: string
          name: string
          region: string | null
          registration_date: string | null
          registration_number: string
          social_dev_center_id: string | null
          status: string
          sub_classification_id: string | null
          type: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          employees_count?: number | null
          entity_type?: Database["public"]["Enums"]["entity_type"] | null
          id?: string
          name: string
          region?: string | null
          registration_date?: string | null
          registration_number: string
          social_dev_center_id?: string | null
          status?: string
          sub_classification_id?: string | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          employees_count?: number | null
          entity_type?: Database["public"]["Enums"]["entity_type"] | null
          id?: string
          name?: string
          region?: string | null
          registration_date?: string | null
          registration_number?: string
          social_dev_center_id?: string | null
          status?: string
          sub_classification_id?: string | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_social_dev_center_id_fkey"
            columns: ["social_dev_center_id"]
            isOneToOne: false
            referencedRelation: "social_dev_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_sub_classification_id_fkey"
            columns: ["sub_classification_id"]
            isOneToOne: false
            referencedRelation: "sub_classifications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          organization_id: string | null
          organization_name: string | null
          registration_number: string | null
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          organization_id?: string | null
          organization_name?: string | null
          registration_number?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          organization_id?: string | null
          organization_name?: string | null
          registration_number?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_dev_centers: {
        Row: {
          code: string
          id: string
          name: string
          region: string | null
        }
        Insert: {
          code: string
          id?: string
          name: string
          region?: string | null
        }
        Update: {
          code?: string
          id?: string
          name?: string
          region?: string | null
        }
        Relationships: []
      }
      standards: {
        Row: {
          id: string
          name: string
          number: number
          tool_version_id: string
          track_id: string
        }
        Insert: {
          id?: string
          name: string
          number: number
          tool_version_id: string
          track_id: string
        }
        Update: {
          id?: string
          name?: string
          number?: number
          tool_version_id?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "standards_tool_version_id_fkey"
            columns: ["tool_version_id"]
            isOneToOne: false
            referencedRelation: "tool_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standards_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_classifications: {
        Row: {
          code: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      tool_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          code: string
          created_at: string
          id: string
          source_file_name: string | null
          source_sha256: string | null
          status: Database["public"]["Enums"]["tool_version_status"]
          title: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          code: string
          created_at?: string
          id?: string
          source_file_name?: string | null
          source_sha256?: string | null
          status?: Database["public"]["Enums"]["tool_version_status"]
          title: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          code?: string
          created_at?: string
          id?: string
          source_file_name?: string | null
          source_sha256?: string | null
          status?: Database["public"]["Enums"]["tool_version_status"]
          title?: string
        }
        Relationships: []
      }
      tracks: {
        Row: {
          id: string
          name: string
          number: number
          tool_version_id: string
        }
        Insert: {
          id?: string
          name: string
          number: number
          tool_version_id: string
        }
        Update: {
          id?: string
          name?: string
          number?: number
          tool_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_tool_version_id_fkey"
            columns: ["tool_version_id"]
            isOneToOne: false
            referencedRelation: "tool_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assessment_editable_by_org: {
        Args: { p_assessment: string }
        Returns: boolean
      }
      assessment_reviewable_by_me: {
        Args: { p_assessment: string }
        Returns: boolean
      }
      current_org_id: { Args: Record<PropertyKey, never>; Returns: string }
      ensure_my_assessment: {
        Args: Record<PropertyKey, never>
        Returns: {
          approved_at: string | null
          created_at: string
          cycle_id: string
          id: string
          organization_id: string
          return_note: string | null
          returned_at: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          submitted_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "assessments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_assigned_evaluator: {
        Args: { p_assessment: string }
        Returns: boolean
      }
      is_evaluator: { Args: Record<PropertyKey, never>; Returns: boolean }
      transition_assessment: {
        Args: {
          p_assessment: string
          p_note?: string
          p_to: Database["public"]["Enums"]["assessment_status"]
        }
        Returns: {
          approved_at: string | null
          created_at: string
          cycle_id: string
          id: string
          organization_id: string
          return_note: string | null
          returned_at: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          submitted_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "assessments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "evaluator" | "user" | "organization" | "individual"
      assessment_status:
        "draft" | "submitted" | "under_review" | "returned" | "approved"
      cycle_status: "draft" | "open" | "closed" | "archived"
      entity_type: "association" | "foundation"
      evidence_kind: "file" | "link"
      profile_status: "pending_verification" | "profile_incomplete" | "active"
      request_status: "pending" | "approved" | "rejected"
      tool_version_status: "draft" | "approved" | "retired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "evaluator", "user", "organization", "individual"],
      assessment_status: [
        "draft",
        "submitted",
        "under_review",
        "returned",
        "approved",
      ],
      cycle_status: ["draft", "open", "closed", "archived"],
      entity_type: ["association", "foundation"],
      evidence_kind: ["file", "link"],
      profile_status: ["pending_verification", "profile_incomplete", "active"],
      request_status: ["pending", "approved", "rejected"],
      tool_version_status: ["draft", "approved", "retired"],
    },
  },
} as const
