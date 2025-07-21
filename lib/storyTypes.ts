export interface ProjectSubject {
  type: 'self' | 'other';
  personName: string;
  birthYear: string;
  relationship: string;
  isDeceased: boolean;
  passedAwayYear: string;
  includeWhatsappChat: boolean;
  whatsappChatFile: File | null;
}

export interface ProjectCollaborators {
  partner: boolean;
  children: boolean;
  family: boolean;
  friends: boolean;
  emails: string;
}

export interface ProjectPeriod {
  type: 'fullLife' | 'specificPeriod' | 'specificTheme';
  startYear: string;
  endYear: string;
  theme: string;
}

export interface ProjectStyle {
  writingStyle: string;
}

export interface ProjectCommunication {
  whatsapp: boolean;
  email: boolean;
  dashboard: boolean;
  voice: boolean;
}

export interface ProjectDelivery {
  format: string;
}

export interface ProjectData {
  subject: ProjectSubject;
  collaborators: ProjectCollaborators;
  period: ProjectPeriod;
  style: ProjectStyle;
  communication: ProjectCommunication;
  delivery: ProjectDelivery;
  additionalInfo: string;
}

export interface StoryQuestion {
  id: string;
  question: string;
  category: string;
  answer: string;
  generated: boolean;
  suggestedAnswerer: 'self' | 'family' | 'friends' | 'partner' | 'children' | 'anyone';
  assignedTo: string;
}

export interface StepConfig {
  number: number;
  title: string;
  icon: string;
}

export const PROJECT_STEPS: StepConfig[] = [
  { number: 1, title: "Onderwerp", icon: "👤" },
  { number: 2, title: "Helpers", icon: "👥" },
  { number: 3, title: "Periode", icon: "📅" },
  { number: 4, title: "Stijl", icon: "✍️" },
  { number: 5, title: "Contact", icon: "📱" },
  { number: 6, title: "Levering", icon: "📦" },
  { number: 7, title: "Vertel meer", icon: "💭" },
  { number: 8, title: "Vragen", icon: "❓" }
];

export const ANSWERER_OPTIONS = [
  { value: 'self', label: 'Jezelf', icon: '👤' },
  { value: 'family', label: 'Familie', icon: '👨‍👩‍👧‍👦' },
  { value: 'friends', label: 'Vrienden', icon: '👥' },
  { value: 'partner', label: 'Partner', icon: '💑' },
  { value: 'children', label: 'Kinderen', icon: '👶' },
  { value: 'anyone', label: 'Iedereen', icon: '🌍' }
];

export const WRITING_STYLES = [
  {
    value: 'neutral',
    label: 'Neutraal',
    description: 'Objectieve, journalistieke stijl',
    icon: '📰'
  },
  {
    value: 'personal',
    label: 'Persoonlijk',
    description: 'Warme, persoonlijke verteltrant',
    icon: '💝'
  },
  {
    value: 'narrative',
    label: 'Verhalend',
    description: 'Boeiende, literaire stijl',
    icon: '📚'
  },
  {
    value: 'conversational',
    label: 'Gesproken',
    description: 'Alsof je het aan een vriend vertelt',
    icon: '💬'
  }
];

export const DELIVERY_FORMATS = [
  {
    value: 'digital',
    label: 'Digitaal boek',
    description: 'PDF die je kunt delen en printen',
    icon: '📱'
  },
  {
    value: 'physical',
    label: 'Fysiek boek',
    description: 'Gedrukt boek thuisbezorgd',
    icon: '📖'
  },
  {
    value: 'both',
    label: 'Beide',
    description: 'Digitaal én fysiek boek',
    icon: '📚'
  }
];
