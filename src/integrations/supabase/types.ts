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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          acao: string
          company_id: string
          created_at: string
          detalhes: string
          economia: number | null
          id: string
          tipo: string
          valor: number | null
        }
        Insert: {
          acao: string
          company_id: string
          created_at?: string
          detalhes: string
          economia?: number | null
          id?: string
          tipo: string
          valor?: number | null
        }
        Update: {
          acao?: string
          company_id?: string
          created_at?: string
          detalhes?: string
          economia?: number | null
          id?: string
          tipo?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string | null
          corporate_group_id: string | null
          created_at: string | null
          id: string
          max_users: number | null
          name: string
          subscription_expires_at: string | null
          subscription_plan: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          cnpj?: string | null
          corporate_group_id?: string | null
          created_at?: string | null
          id?: string
          max_users?: number | null
          name: string
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          cnpj?: string | null
          corporate_group_id?: string | null
          created_at?: string | null
          id?: string
          max_users?: number | null
          name?: string
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_corporate_group_id_fkey"
            columns: ["corporate_group_id"]
            isOneToOne: false
            referencedRelation: "corporate_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invitations: {
        Row: {
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          invited_by: string | null
          joined_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_groups: {
        Row: {
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          id: string
          max_companies: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          max_companies?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          max_companies?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          importance: string
          observation: string | null
          resolved: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          importance?: string
          observation?: string | null
          resolved?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          importance?: string
          observation?: string | null
          resolved?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          total_price: number
          unit?: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          company_id: string
          created_at: string
          delivery_date: string
          id: string
          observations: string | null
          order_date: string
          status: string
          supplier_id: string | null
          supplier_name: string
          total_value: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          delivery_date: string
          id?: string
          observations?: string | null
          order_date?: string
          status?: string
          supplier_id?: string | null
          supplier_name: string
          total_value?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          delivery_date?: string
          id?: string
          observations?: string | null
          order_date?: string
          status?: string
          supplier_id?: string | null
          supplier_name?: string
          total_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          advanced_analytics: boolean | null
          api_access: boolean | null
          created_at: string | null
          max_products: number | null
          max_quotes_per_month: number | null
          max_suppliers: number | null
          max_users: number | null
          plan_name: string
          priority_support: boolean | null
        }
        Insert: {
          advanced_analytics?: boolean | null
          api_access?: boolean | null
          created_at?: string | null
          max_products?: number | null
          max_quotes_per_month?: number | null
          max_suppliers?: number | null
          max_users?: number | null
          plan_name: string
          priority_support?: boolean | null
        }
        Update: {
          advanced_analytics?: boolean | null
          api_access?: boolean | null
          created_at?: string | null
          max_products?: number | null
          max_quotes_per_month?: number | null
          max_suppliers?: number | null
          max_users?: number | null
          plan_name?: string
          priority_support?: boolean | null
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category: string
          company_id: string
          created_at: string
          id: string
          image_url: string | null
          name: string
          unit: string
          updated_at: string
          weight: string | null
        }
        Insert: {
          barcode?: string | null
          category: string
          company_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          unit?: string
          updated_at?: string
          weight?: string | null
        }
        Update: {
          barcode?: string | null
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          unit?: string
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          quantidade: string
          quote_id: string
          unidade: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          quantidade: string
          quote_id: string
          unidade: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          quantidade?: string
          quote_id?: string
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_supplier_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          quote_id: string
          supplier_id: string
          updated_at: string
          valor_oferecido: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          quote_id: string
          supplier_id: string
          updated_at?: string
          valor_oferecido?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          quote_id?: string
          supplier_id?: string
          updated_at?: string
          valor_oferecido?: number | null
        }
        Relationships: []
      }
      quote_suppliers: {
        Row: {
          created_at: string
          data_resposta: string | null
          id: string
          observacoes: string | null
          quote_id: string
          status: string
          supplier_id: string
          supplier_name: string
          updated_at: string
          valor_oferecido: number | null
        }
        Insert: {
          created_at?: string
          data_resposta?: string | null
          id?: string
          observacoes?: string | null
          quote_id: string
          status?: string
          supplier_id: string
          supplier_name: string
          updated_at?: string
          valor_oferecido?: number | null
        }
        Update: {
          created_at?: string
          data_resposta?: string | null
          id?: string
          observacoes?: string | null
          quote_id?: string
          status?: string
          supplier_id?: string
          supplier_name?: string
          updated_at?: string
          valor_oferecido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_suppliers_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          company_id: string
          created_at: string
          data_fim: string
          data_inicio: string
          data_planejada: string | null
          id: string
          observacoes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data_fim: string
          data_inicio: string
          data_planejada?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          data_planejada?: string | null
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_count_items: {
        Row: {
          id: string
          notes: string | null
          order_item_id: string | null
          photo_url: string | null
          product_id: string | null
          product_name: string
          quantity_counted: number | null
          quantity_existing: number | null
          quantity_ordered: number | null
          sector_id: string
          stock_count_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          order_item_id?: string | null
          photo_url?: string | null
          product_id?: string | null
          product_name: string
          quantity_counted?: number | null
          quantity_existing?: number | null
          quantity_ordered?: number | null
          sector_id: string
          stock_count_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          order_item_id?: string | null
          photo_url?: string | null
          product_id?: string | null
          product_name?: string
          quantity_counted?: number | null
          quantity_existing?: number | null
          quantity_ordered?: number | null
          sector_id?: string
          stock_count_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_count_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_items_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "stock_sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_items_stock_count_id_fkey"
            columns: ["stock_count_id"]
            isOneToOne: false
            referencedRelation: "stock_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_counts: {
        Row: {
          company_id: string
          completed_at: string | null
          completed_by: string | null
          count_date: string | null
          created_at: string | null
          id: string
          notes: string | null
          order_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          completed_by?: string | null
          count_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          completed_by?: string | null
          count_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_counts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_counts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_sectors: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_sectors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          cnpj: string | null
          company_id: string
          contact: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          rating: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          company_id: string
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          rating?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          company_id?: string
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
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
      calculate_group_discount: {
        Args: { _corporate_group_id: string }
        Returns: number
      }
      get_all_companies_for_admin: {
        Args: never
        Returns: {
          cnpj: string
          corporate_group_id: string
          created_at: string
          id: string
          name: string
          products_count: number
          subscription_expires_at: string
          subscription_plan: string
          subscription_status: string
          suppliers_count: number
          trial_ends_at: string
          updated_at: string
          users_count: number
        }[]
      }
      get_plan_features: {
        Args: { p_plan_name: string }
        Returns: {
          advanced_analytics: boolean
          api_access: boolean
          max_products: number
          max_quotes_per_month: number
          max_suppliers: number
          max_users: number
          priority_support: boolean
        }[]
      }
      get_stock_count_sector_summary: {
        Args: { p_stock_count_id: string }
        Returns: {
          discrepancies: number
          sector_id: string
          sector_name: string
          total_counted: number
          total_existing: number
          total_items: number
          total_ordered: number
        }[]
      }
      get_system_stats: {
        Args: never
        Returns: {
          active_companies: number
          basic_plan_count: number
          cancelled_companies: number
          enterprise_plan_count: number
          professional_plan_count: number
          suspended_companies: number
          total_companies: number
          total_orders: number
          total_products: number
          total_quotes: number
          total_suppliers: number
          total_users: number
          trial_companies: number
        }[]
      }
      get_user_company_id: { Args: { p_user_id: string }; Returns: string }
      get_user_corporate_group_id: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_system_admin: { Args: never; Returns: boolean }
      is_subscription_active: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_system_admin: { Args: { p_user_id: string }; Returns: boolean }
      update_company_plan: {
        Args: {
          p_company_id: string
          p_new_plan: string
          p_new_status?: string
        }
        Returns: boolean
      }
      update_company_subscription_status: {
        Args: {
          p_company_id: string
          p_expires_at?: string
          p_new_status: string
        }
        Returns: boolean
      }
      user_has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "member" | "system_admin"
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
      app_role: ["owner", "admin", "member", "system_admin"],
    },
  },
} as const
