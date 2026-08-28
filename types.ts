export type ViewState = 'login' | 'vault' | 'studio' | 'calendar' | 'leads' | 'inbox' | 'settings';

export interface User {
  name: string;
  avatar: string;
  role: string;
}



export interface ChatMessage {
  id: string;
  sender: 'user' | 'lead' | 'system';
  content: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  avatar: string;
  source: string;
  platform: 'facebook' | 'instagram' | 'other';
  score: number; // 0-100
  status: 'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  lastActivity: string;
  email: string;
  chatHistory?: ChatMessage[];
  externalConversationId?: string; // Platform-specific conversation ID for API calls
}

export interface Asset {
  id: string;
  title: string;
  type: 'Video' | 'Audio' | 'PDF' | 'Text';
  programme: string;
  status: 'Ready' | 'Processing' | 'Archived';
  thumbnail: string;
  transcript?: string;
  uploadDate: string;
  // Store the actual file for processing
  fileBlob?: Blob;
}

export interface CalendarPost {
  id: string;
  date: string; // ISO Date String YYYY-MM-DD
  title: string;
  channel: 'LinkedIn' | 'Twitter' | 'Instagram' | 'Email';
  status: 'Scheduled' | 'Published';
}

export interface GeneratedContent {
  linkedin: string;
  twitter: string;
  newsletter: string;
  whatsapp: string;
}

export enum DealStage {
  NEW = 'New',
  QUALIFIED = 'Qualified',
  PROPOSAL = 'Proposal Sent',
  NEGOTIATING = 'Negotiating',
  WON = 'Won',
  LOST = 'Lost'
}

export type RepurposeType = 'Summarize' | 'Image_Gen' | 'Video_Sora';

export const REPURPOSE_OPTIONS: Record<string, { label: string; desc: string; models: string[] }> = {
  Summarize: { label: 'Summarize', desc: 'Extract key insights + captions', models: ['gpt-4o-mini-transcribe', 'GPT-4o-mini'] },
  Image_Gen: { label: 'Visuals', desc: 'Generate images + captions', models: ['DALL-E 3', 'GPT-4o-mini'] },
  Video_Sora: { label: 'Video Gen', desc: 'Create video + captions', models: ['Sora 2', 'GPT-4o-mini'] },
};

export interface RepurposeJob {
  id: string;
  assetId: string;
  assetTitle: string;
  type: RepurposeType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStage: string;
  currentModel: string;
  scheduledDate: string;
  createdAt: string;
}

// ============================================
// SUPABASE TYPES
// ============================================

// Reply status lifecycle: new → suggested → approved → sent
export type ReplyStatus = 'new' | 'suggested' | 'approved' | 'sent' | 'failed';

// Post status lifecycle: draft → scheduled → sent
export type PostStatus = 'draft' | 'scheduled' | 'sent' | 'failed';

// Platform types
export type Platform = 'facebook' | 'instagram';

// Social Comments table (Replies Flow - Inbox UI)
export interface SocialComment {
  id: string;
  platform: Platform;
  post_id: string;
  comment_id: string;
  author: string | null;
  message: string;
  created_at: string | null;
  ai_suggested_reply: string | null;
  ai_confidence: number | null;
  approved_reply: string | null;
  reply_status: ReplyStatus;
  sent_at: string | null;
  inserted_at: string;
}

// Scheduled Posts table (Posts Flow - Calendar UI)
export interface ScheduledPost {
  id: string;
  platforms: Platform[];
  content: Record<Platform, string>; // e.g., { facebook: "...", instagram: "..." }
  image_url?: string | null; // AI-generated image URL
  status: PostStatus;
  schedule_at: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
}

// Activity Logs table (Audit Trail)
export interface ActivityLog {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  action: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

