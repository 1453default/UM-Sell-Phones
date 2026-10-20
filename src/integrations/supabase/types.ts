export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      pickup_requests: {
        Row: {
          address_line: string;
          admin_notes: string | null;
          answer_summary: string[];
          answers: Json;
          assigned_to: string | null;
          base_value: number;
          brand: string;
          created_at: string;
          customer_name: string;
          estimate: number;
          id: string;
          landmark: string | null;
          locality: string;
          mobile: string;
          model: string;
          phone_verification_status: string;
          pincode: string;
          reference: string;
          slot_date: string;
          slot_time: string;
          status: string;
          submission_key: string | null;
          updated_at: string;
          variant: string;
        };
        Insert: {
          address_line: string;
          admin_notes?: string | null;
          answer_summary?: string[];
          answers: Json;
          assigned_to?: string | null;
          base_value: number;
          brand: string;
          created_at?: string;
          customer_name: string;
          estimate: number;
          id?: string;
          landmark?: string | null;
          locality: string;
          mobile: string;
          model: string;
          phone_verification_status?: string;
          pincode: string;
          reference: string;
          slot_date: string;
          slot_time: string;
          status?: string;
          submission_key?: string | null;
          updated_at?: string;
          variant: string;
        };
        Update: {
          address_line?: string;
          admin_notes?: string | null;
          answer_summary?: string[];
          answers?: Json;
          assigned_to?: string | null;
          base_value?: number;
          brand?: string;
          created_at?: string;
          customer_name?: string;
          estimate?: number;
          id?: string;
          landmark?: string | null;
          locality?: string;
          mobile?: string;
          model?: string;
          phone_verification_status?: string;
          pincode?: string;
          reference?: string;
          slot_date?: string;
          slot_time?: string;
          status?: string;
          submission_key?: string | null;
          updated_at?: string;
          variant?: string;
        };
        Relationships: [];
      };
      pickup_notification_outbox: {
        Row: {
          attempts: number;
          created_at: string;
          delivered_at: string | null;
          id: string;
          last_attempt_at: string | null;
          last_error_code: string | null;
          pickup_request_id: string;
          provider_message_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          delivered_at?: string | null;
          id?: string;
          last_attempt_at?: string | null;
          last_error_code?: string | null;
          pickup_request_id: string;
          provider_message_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          delivered_at?: string | null;
          id?: string;
          last_attempt_at?: string | null;
          last_error_code?: string | null;
          pickup_request_id?: string;
          provider_message_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pickup_notification_outbox_pickup_request_id_fkey";
            columns: ["pickup_request_id"];
            isOneToOne: true;
            referencedRelation: "pickup_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_pickup_request_atomic: {
        Args: {
          p_address_line: string;
          p_answer_summary: string[];
          p_answers: Json;
          p_base_value: number;
          p_brand: string;
          p_customer_name: string;
          p_estimate: number;
          p_landmark: string | null;
          p_locality: string;
          p_mobile: string;
          p_mobile_key_hash: string;
          p_model: string;
          p_pincode: string;
          p_reference: string;
          p_slot_date: string;
          p_slot_time: string;
          p_submission_key: string | null;
          p_variant: string;
        };
        Returns: {
          created: boolean;
          rate_limited: boolean;
          reference: string | null;
          request_id: string | null;
        }[];
      };
      claim_pickup_notification: {
        Args: { p_request_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const;
