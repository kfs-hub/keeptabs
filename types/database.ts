export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type FineStatus = 'unpaid' | 'paid' | 'disputed' | 'cancelled'
export type PaymentStatus = 'pending' | 'processing' | 'successful' | 'failed' | 'refunded'
export type DisputeStatus = 'pending' | 'approved' | 'cancelled' | 'modified'
export type MemberRole = 'owner' | 'admin' | 'member'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          username?: string
          display_name?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          invite_code: string
          created_by: string
          currency: string
          default_fine_amount: number
          icon_url: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          invite_code: string
          created_by: string
          currency?: string
          default_fine_amount?: number
          icon_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          invite_code?: string
          currency?: string
          default_fine_amount?: number
          icon_url?: string | null
          settings?: Json
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: MemberRole
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: MemberRole
          joined_at?: string
        }
        Update: {
          role?: MemberRole
        }
      }
      rules: {
        Row: {
          id: string
          group_id: string
          name: string
          description: string | null
          default_amount: number
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          description?: string | null
          default_amount: number
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          default_amount?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      fines: {
        Row: {
          id: string
          group_id: string
          rule_id: string | null
          fined_user_id: string
          reported_by: string
          amount: number
          description: string | null
          evidence_url: string | null
          status: FineStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          rule_id?: string | null
          fined_user_id: string
          reported_by: string
          amount: number
          description?: string | null
          evidence_url?: string | null
          status?: FineStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          rule_id?: string | null
          amount?: number
          description?: string | null
          evidence_url?: string | null
          status?: FineStatus
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          group_id: string
          user_id: string
          amount: number
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: PaymentStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          amount: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: PaymentStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          razorpay_payment_id?: string | null
          status?: PaymentStatus
          updated_at?: string
        }
      }
      payment_fines: {
        Row: {
          payment_id: string
          fine_id: string
          amount: number
        }
        Insert: {
          payment_id: string
          fine_id: string
          amount: number
        }
        Update: {
          amount?: number
        }
      }
      disputes: {
        Row: {
          id: string
          fine_id: string
          submitted_by: string
          reason: string
          status: DisputeStatus
          reviewed_by: string | null
          resolution: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fine_id: string
          submitted_by: string
          reason: string
          status?: DisputeStatus
          reviewed_by?: string | null
          resolution?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: DisputeStatus
          reviewed_by?: string | null
          resolution?: string | null
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          group_id: string
          type: string
          title: string
          message: string
          read: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          group_id: string
          type?: string
          title: string
          message: string
          read?: boolean
          metadata?: Json
          created_at?: string
        }
        Update: {
          read?: boolean
        }
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          condition_type: string
          condition_value: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          condition_type: string
          condition_value: number
          created_at?: string
        }
        Update: {
          name?: string
          description?: string
          icon?: string
        }
      }
      user_achievements: {
        Row: {
          user_id: string
          group_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          user_id: string
          group_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: Record<string, never>
      }
      audit_logs: {
        Row: {
          id: string
          group_id: string
          actor_id: string
          action: string
          target_type: string | null
          target_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          actor_id: string
          action: string
          target_type?: string | null
          target_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: Record<string, never>
      }
      processed_webhook_events: {
        Row: {
          id: string
          event_id: string
          event_type: string
          processed_at: string
        }
        Insert: {
          id?: string
          event_id: string
          event_type: string
          processed_at?: string
        }
        Update: Record<string, never>
      }
      rate_limit_log: {
        Row: {
          id: string
          user_id: string
          action: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          created_at?: string
        }
        Update: Record<string, never>
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          endpoint?: string
          p256dh?: string
          auth?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_groups: {
        Args: Record<string, never>
        Returns: string[]
      }
      is_group_admin: {
        Args: { p_group_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { p_group_id: string }
        Returns: boolean
      }
    }
    Enums: {
      fine_status: FineStatus
      payment_status: PaymentStatus
      dispute_status: DisputeStatus
      member_role: MemberRole
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Group = Database['public']['Tables']['groups']['Row']
export type GroupMember = Database['public']['Tables']['group_members']['Row']
export type Rule = Database['public']['Tables']['rules']['Row']
export type Fine = Database['public']['Tables']['fines']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentFine = Database['public']['Tables']['payment_fines']['Row']
export type Dispute = Database['public']['Tables']['disputes']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row']
export type Achievement = Database['public']['Tables']['achievements']['Row']
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

// Extended types with joins
export type FineWithDetails = Fine & {
  fined_user: Profile
  reporter: Profile
  rule: Rule | null
}

export type MemberWithProfile = GroupMember & {
  profile: Profile
}

export type PaymentWithFines = Payment & {
  payment_fines: (PaymentFine & { fine: Fine })[]
}

export type DisputeWithFine = Dispute & {
  fine: FineWithDetails
  submitter: Profile
  reviewer: Profile | null
}

export type NotificationWithGroup = Notification & {
  group: Group
}

export type GroupSettings = {
  leaderboard_labels?: {
    first?: string
    second?: string
    third?: string
    most_fined?: string
    most_owed?: string
    most_responsible?: string
  }
}
