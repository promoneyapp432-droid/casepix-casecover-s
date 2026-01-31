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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      a_plus_content: {
        Row: {
          case_type: Database["public"]["Enums"]["case_type"]
          created_at: string
          default_image_2: string | null
          default_image_3: string | null
          default_image_4: string | null
          default_image_5: string | null
          default_image_6: string | null
          description: string | null
          features: Json | null
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          case_type: Database["public"]["Enums"]["case_type"]
          created_at?: string
          default_image_2?: string | null
          default_image_3?: string | null
          default_image_4?: string | null
          default_image_5?: string | null
          default_image_6?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          case_type?: Database["public"]["Enums"]["case_type"]
          created_at?: string
          default_image_2?: string | null
          default_image_3?: string | null
          default_image_4?: string | null
          default_image_5?: string | null
          default_image_6?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          image: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          image?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          image?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      compatible_groups: {
        Row: {
          case_type: Database["public"]["Enums"]["case_type"]
          created_at: string
          id: string
          is_visible: boolean
          model_id: string
          updated_at: string
        }
        Insert: {
          case_type: Database["public"]["Enums"]["case_type"]
          created_at?: string
          id?: string
          is_visible?: boolean
          model_id: string
          updated_at?: string
        }
        Update: {
          case_type?: Database["public"]["Enums"]["case_type"]
          created_at?: string
          id?: string
          is_visible?: boolean
          model_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compatible_groups_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "mobile_models"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_brands: {
        Row: {
          created_at: string
          id: string
          logo: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          logo?: string | null
          name?: string
        }
        Relationships: []
      }
      mobile_models: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          image: string | null
          name: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          image?: string | null
          name: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          image?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "mobile_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          case_type: Database["public"]["Enums"]["case_type"]
          created_at: string
          description: string | null
          id: string
          image: string | null
          price: number
          product_id: string
          stock: number | null
          title: string
          updated_at: string
        }
        Insert: {
          case_type: Database["public"]["Enums"]["case_type"]
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          price: number
          product_id: string
          stock?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          case_type?: Database["public"]["Enums"]["case_type"]
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          price?: number
          product_id?: string
          stock?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image: string | null
          image_2: string | null
          image_3: string | null
          image_4: string | null
          image_5: string | null
          image_6: string | null
          is_new: boolean | null
          is_top_design: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          image_2?: string | null
          image_3?: string | null
          image_4?: string | null
          image_5?: string | null
          image_6?: string | null
          is_new?: boolean | null
          is_top_design?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          image_2?: string | null
          image_3?: string | null
          image_4?: string | null
          image_5?: string | null
          image_6?: string | null
          is_new?: boolean | null
          is_top_design?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_first_user: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      case_type: "metal" | "snap"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      case_type: ["metal", "snap"],
    },
  },
} as const
