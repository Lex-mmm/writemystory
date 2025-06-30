// Admin-specific TypeScript interfaces

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

export interface AdminProject {
  id: string;
  user_id: string;
  person_name?: string;
  subject_type: string;
  period_type: string;
  writing_style: string;
  status: string;
  progress: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AdminQuestion {
  id: string;
  story_id: string;
  category: string;
  question: string;
  type: string;
  priority: number;
  created_at: string;
}

export interface AdminAnswer {
  id: string;
  question_id: string;
  story_id: string;
  user_id: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUserDetails extends AdminUser {
  projects: AdminProject[];
  totalQuestions: number;
  totalAnswers: number;
  averageProgress: number;
}

export interface AdminOverviewStats {
  totalUsers: number;
  totalProjects: number;
  totalQuestions: number;
  totalAnswers: number;
  recentSignups: number; // Last 7 days
  activeProjects: number;
  completedProjects: number;
}

export interface AdminOverviewResponse {
  stats: AdminOverviewStats;
  users: AdminUserDetails[];
  recentActivity: {
    newUsers: AdminUser[];
    newProjects: AdminProject[];
    recentAnswers: AdminAnswer[];
  };
}

export interface AdminProjectDetails extends AdminProject {
  questions: AdminQuestion[];
  answers: AdminAnswer[];
  user?: Pick<AdminUser, 'id' | 'email'>;
}
