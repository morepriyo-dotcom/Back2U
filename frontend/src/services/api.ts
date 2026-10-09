const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const getAuthToken = () => localStorage.getItem('back2u_token');
export const setAuthToken = (token: string) => localStorage.setItem('back2u_token', token);
export const removeAuthToken = () => localStorage.removeItem('back2u_token');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errData = await response.json();
      errorDetail = errData.detail || errData.message || JSON.stringify(errData);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: any) => request<any>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  demoLogin: (role: string) => request<any>('/api/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  sendPhoneOTP: (phone_number: string) =>
    request<{ message: string; phone_number: string; expires_in_seconds: number; dev_sms_simulation?: string }>(
      '/api/auth/phone/send-otp',
      { method: 'POST', body: JSON.stringify({ phone_number }) }
    ),
  verifyPhoneOTP: (phone_number: string, otp_code: string, full_name?: string) =>
    request<any>('/api/auth/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number, otp_code, full_name }),
    }),
  getMe: () => request<any>('/api/auth/me'),

  // Items
  getItems: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, String(val));
    });
    return request<any[]>(`/api/items?${query.toString()}`);
  },
  getPaginatedItems: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, String(val));
    });
    return request<{ items: any[]; total_count: number; page: number; limit: number; total_pages: number }>(
      `/api/items/paginated?${query.toString()}`
    );
  },
  getOfficialCertificate: (id: number) => request<any>(`/api/items/${id}/certificate`),
  getRecentItems: () => request<{ recently_lost: any[]; recently_found: any[] }>('/api/items/recent'),
  getItemDetail: (id: number) => request<any>(`/api/items/${id}`),
  createItem: (data: any) => request<any>('/api/items', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (id: number, data: any) => request<any>(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteItem: (id: number) => request<any>(`/api/items/${id}`, { method: 'DELETE' }),
  getMyReports: () => request<any[]>('/api/items/my/reports'),

  // AI Matching
  getAIMatches: (itemId: number) => request<{ query_item: any; total_potential_matches: number; matches: any[] }>(`/api/matching/item/${itemId}`),

  // Claims
  submitClaim: (data: any) => request<any>('/api/claims', { method: 'POST', body: JSON.stringify(data) }),
  getMyClaims: () => request<{ submitted_claims: any[]; received_claims: any[] }>('/api/claims/my'),
  getClaimDetail: (id: number) => request<any>(`/api/claims/${id}`),
  updateClaimStatus: (id: number, data: { status: string; rejection_reason?: string; admin_notes?: string }) =>
    request<any>(`/api/claims/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),

  // Recovery
  getRecoveryCase: (claimId: number) => request<any>(`/api/recovery/${claimId}`),
  confirmHandover: (claimId: number, data: { handover_notes?: string }) =>
    request<any>(`/api/recovery/${claimId}/confirm`, { method: 'POST', body: JSON.stringify(data) }),

  // Rewards
  getRewardsSummary: () => request<any>('/api/rewards/summary'),
  getTransactions: () => request<any[]>('/api/rewards/transactions'),

  // Marketplace
  getUnclaimedListings: () => request<any[]>('/api/marketplace/unclaimed'),
  createRequestToBuy: (data: any) => request<any>('/api/marketplace/request-to-buy', { method: 'POST', body: JSON.stringify(data) }),
  getMyBuyRequests: () => request<any[]>('/api/marketplace/my-requests'),
  placeBid: (auctionId: number, bidPoints: number) =>
    request<any>(`/api/marketplace/auctions/${auctionId}/bid`, { method: 'POST', body: JSON.stringify({ bid_points: bidPoints }) }),

  // Notifications
  getNotifications: () => request<{ notifications: any[]; unread_count: number }>('/api/notifications'),
  markNotificationRead: (id: number) => request<any>(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<any>('/api/notifications/read-all', { method: 'PUT' }),

  // Admin
  getAdminOverview: () => request<{ metrics: any }>('/api/admin/overview'),
  getAdminClaims: (disputedOnly = false, highRiskOnly = false) =>
    request<any[]>(`/api/admin/claims?disputed_only=${disputedOnly}&high_risk_only=${highRiskOnly}`),
  resolveAdminClaim: (id: number, data: any) => request<any>(`/api/admin/claims/${id}/resolve`, { method: 'POST', body: JSON.stringify(data) }),
  getAdminItems: (flaggedOnly = false) => request<any[]>(`/api/admin/items?flagged_only=${flaggedOnly}`),
  takeAdminItemAction: (id: number, data: any) => request<any>(`/api/admin/items/${id}/action`, { method: 'POST', body: JSON.stringify(data) }),
  getAdminUsers: (restrictedOnly = false) => request<any[]>(`/api/admin/users?restricted_only=${restrictedOnly}`),
  applyAdminPenalty: (userId: number, data: any) => request<any>(`/api/admin/users/${userId}/penalty`, { method: 'POST', body: JSON.stringify(data) }),
  getAuditLogs: () => request<any[]>('/api/admin/audit-logs'),

  // Upload
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ url: string; filename: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Health
  getHealth: () => request<any>('/api/health'),
};
