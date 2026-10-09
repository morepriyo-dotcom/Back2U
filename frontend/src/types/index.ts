export type UserRole = 'visitor' | 'user' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  trust_score: number;
  penalty_points: number;
  points_balance: number;
  is_active: boolean;
  is_restricted: boolean;
  restriction_reason?: string;
  created_at: string;
}

export type ReportType = 'LOST' | 'FOUND';

export type ItemStatus =
  | 'REPORTED'
  | 'UNDER_CLAIM'
  | 'RECOVERY_IN_PROGRESS'
  | 'RETURNED'
  | 'UNCLAIMED_EXPIRING'
  | 'UNCLAIMED_AUCTION'
  | 'UNCLAIMED_DONATED'
  | 'CLOSED';

export type CustodyStatus =
  | 'IN_POSSESSION'
  | 'SECURITY_DESK'
  | 'POLICE'
  | 'CAMPUS_OFFICE'
  | 'SMART_LOCKER';

export interface Item {
  id: number;
  report_type: ReportType;
  title: string;
  category: string;
  description: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  incident_date: string;
  image_url?: string;
  brand?: string;
  model?: string;
  custody_status: CustodyStatus;
  status: ItemStatus;
  is_demo_seed: boolean;
  is_flagged?: boolean;
  flag_reason?: string;
  created_at: string;
  reporter_id: number;
  reporter_name?: string;
  reporter_trust_score?: number;
  private_clues?: string;
  has_private_clues?: boolean;
}

export interface AIMatchSignal {
  text_similarity_percent: number;
  image_similarity_percent?: number | null;
  location_proximity_percent: number;
  date_proximity_percent: number;
  same_category: boolean;
}

export interface AIMatchCandidate {
  candidate_item_id: number;
  title: string;
  category: string;
  location_name: string;
  incident_date: string;
  image_url?: string;
  report_type: ReportType;
  status: ItemStatus;
  match_score: number;
  label: string; // 'Potential Match'
  match_signals: AIMatchSignal;
  safe_summary: string;
  suggested_next_action: string;
}

export type ClaimStatus =
  | 'SUBMITTED'
  | 'EVIDENCE_REVIEW'
  | 'MORE_EVIDENCE_REQUIRED'
  | 'MANUAL_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'HANDOVER_PENDING'
  | 'RETURN_CONFIRMED'
  | 'ESCALATED'
  | 'CLOSED';

export interface Claim {
  id: number;
  item_id: number;
  claimant_id: number;
  status: ClaimStatus;
  challenge_answers?: string;
  evidence_photos?: string;
  purchase_receipt_url?: string;
  serial_number_provided?: string;
  supporting_notes?: string;
  risk_score: number;
  is_disputed: boolean;
  admin_notes?: string;
  rejection_reason?: string;
  finder_confirmed: boolean;
  owner_confirmed: boolean;
  handover_meeting_notes?: string;
  handover_date?: string;
  points_awarded: boolean;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  item_title?: string;
  item_category?: string;
  item_image_url?: string;
  item_location?: string;
  claimant_name?: string;
  claimant_trust_score?: number;
  finder_id?: number;
  finder_name?: string;
}

export interface PointTransaction {
  id: number;
  user_id: number;
  amount: number;
  transaction_type: string;
  description: string;
  related_item_id?: number;
  related_claim_id?: number;
  created_at: string;
}

export interface RewardsSummary {
  points_balance: number;
  trust_score: number;
  penalty_points: number;
  tier_name: string;
  total_items_returned: number;
  total_items_reported: number;
}

export interface RequestToBuy {
  id: number;
  item_id: number;
  requester_id: number;
  requester_name?: string;
  offer_amount: number;
  currency_type: string;
  message: string;
  status: string;
  finder_response?: string;
  created_at: string;
  item_title?: string;
  item_image_url?: string;
}

export interface AuctionListing {
  id: number;
  item_id: number;
  item_title: string;
  item_category: string;
  item_image_url?: string;
  starting_points: number;
  current_bid_points: number;
  current_highest_bidder_id?: number;
  resolution_type: string;
  admin_approved: boolean;
  status: string;
  end_date: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminOverviewMetrics {
  total_items: number;
  active_lost: number;
  active_found: number;
  total_returned: number;
  recovery_rate_percent: number;
  total_claims: number;
  disputed_claims: number;
  pending_claims: number;
  total_users: number;
  restricted_users: number;
  avg_trust_score: number;
}

export interface AuditLog {
  id: number;
  actor_id?: number;
  actor_email?: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  details?: string;
  ip_address?: string;
  created_at: string;
}
