
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
  systemType?: SystemType;
}

export interface ToolCallArgs {
  query: string;
}

export enum AppMode {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  CLIENT = 'CLIENT',
  GUEST = 'GUEST',
  ADMIN = 'ADMIN',
  LANDING_ADMIN = 'LANDING_ADMIN'
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

export interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Stat {
  label: string;
  value: string;
  icon: string;
}

export interface Plan {
  name: string;
  desc: string;
  features: string[];
  highlight: boolean;
}

export interface LandingConfig {
  // Home Page
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  
  // Stats
  stats: Stat[];

  // Features
  featuresTitle: string;
  featuresSubtitle: string;
  features: LandingFeature[];

  // About Company (Footer/Home)
  aboutCompanyText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  footerText: string;

  // Products
  productsTitle: string;
  productsSubtitle: string;
  whatsappNumber: string;
  products: Product[];

  // Pricing
  plansTitle: string;
  plansSubtitle: string;
  plans: Plan[];

  // Social Links
  facebookUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  whatsappPhone: string;

  // Testimonials
  testimonials: Testimonial[];

  // FAQs
  faqs: FAQ[];
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
