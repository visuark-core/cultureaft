export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  category: SupportCategory;
  priority: SupportPriority;
  subject: string;
  message: string;
  status: SupportStatus;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  responses: SupportResponse[];
  attachments?: SupportAttachment[];
}

export interface SupportResponse {
  id: string;
  ticketId: string;
  message: string;
  isFromSupport: boolean;
  authorName: string;
  authorEmail: string;
  createdAt: Date;
  attachments?: SupportAttachment[];
}

export interface SupportAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export type SupportCategory = 
  | 'order'
  | 'product'
  | 'shipping'
  | 'returns'
  | 'technical'
  | 'billing'
  | 'general';

export type SupportPriority = 'low' | 'medium' | 'high' | 'urgent';

export type SupportStatus = 
  | 'open'
  | 'in_progress'
  | 'waiting_for_customer'
  | 'resolved'
  | 'closed';

export interface SupportFormData {
  name: string;
  email: string;
  phone?: string;
  category: SupportCategory | '';
  priority: SupportPriority;
  subject: string;
  message: string;
}

export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  averageResponseTime: number;
  customerSatisfaction: number;
}