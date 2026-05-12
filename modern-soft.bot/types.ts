
export interface KBItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

export interface ChatLog {
  id: string;
  timestamp: number;
  userQuery: string;
  botResponse: string;
  clientName?: string;
  duration: number;
  isUnanswered?: boolean;
  systemType?: SystemType;
}

export interface Feedback {
  id: string;
  timestamp: number;
  chatId: string;
  rating: number; // 1-5
  comment?: string;
}

export interface ToolCallArgs {
  query: string;
}

export enum AppMode {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN'
}

export interface LandingFeature {
  title: string;
  desc: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price?: string;
}

export interface LandingConfig {
  // Home Page
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  featuresTitle: string;
  featuresSubtitle: string;
  features: LandingFeature[];

  // Footer / General Contact
  aboutCompanyText: string;
  contactEmail: string;
  contactPhone: string;
  footerText: string;

  // Products Page
  productsTitle: string;
  productsSubtitle: string;
  whatsappNumber: string; // WhatsApp Number for Demo Requests
  products: Product[];

  // About Page
  aboutPageTitle: string;
  aboutPageContent: string;
  aboutPageImage: string;

  // Contact Page
  contactPageTitle: string;
  contactAddress: string;
  contactMapUrl: string;
}

export type SystemType = 'e-Stock Pharmacy' | 'e-Stock Retail' | 'Pharma Store';

export interface KnowledgeSnippet {
  id: string;
  content: string;
  imageUrl?: string;
  timestamp: number;
  systemType: SystemType | 'All';
  category?: string;
  menuName?: string;
  screenName?: string;
}

export interface Customer {
  id: string;
  name: string;
  contractNumber: string;
  isActive: boolean;
  createdAt: number;
  lastLogin?: number;
  systemType: SystemType;
}

export interface AppSettings {
  sessionTimeoutMinutes: number;
}

export interface DocChunk {
  id: string;
  systemType: SystemType;
  text: string;
  embedding: number[];
}

export interface DecisionNode {
  id: string;
  text: string; // The question the bot asks
  options: {
    label: string; // The button text for the user
    nextId?: string; // ID of the next node
    finalAnswer?: string; // If it's a leaf, this is the final solution
  }[];
}

export interface TroubleshootFlow {
  id: string;
  systemType: SystemType | 'All';
  triggerKeyword: string; // Word like "طابعة", "انترنت"
  title: string;
  nodes: DecisionNode[];
  startNodeId: string;
}
