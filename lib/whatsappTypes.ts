// TypeScript interfaces for WhatsApp integration

export interface StoryTeamMember {
  id: string;
  story_id: string;
  user_id?: string;
  name: string;
  phone_number: string;
  role: 'author' | 'family' | 'friend' | 'collaborator';
  status: 'active' | 'inactive';
  invited_at: string;
  last_contacted?: string;
  created_at: string;
}

export interface MediaAnswer {
  id: string;
  answer_id: string;
  media_url: string;
  media_type: 'audio' | 'image' | 'video' | 'document';
  file_size?: number;
  duration?: number; // for audio/video in seconds
  transcription?: string; // for audio files
  created_at: string;
}

export interface WhatsAppMessage {
  to: string;
  from: string;
  body?: string;
  mediaUrl?: string;
  mediaContentType?: string;
  messageId: string;
  timestamp: string;
}

export interface TwilioWebhookBody {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body?: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  ProfileName?: string;
}

export interface QuestionWithStory {
  id: string;
  story_id: string;
  category: string;
  question: string;
  type: string;
  priority: number;
  created_at: string;
  story: {
    id: string;
    person_name?: string;
    subject_type: string;
    user_id: string;
  };
}
