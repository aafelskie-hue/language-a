export type Scale = 'neighborhood' | 'building' | 'construction';
export type Confidence = 0 | 1 | 2;
export type PatternStatus = 'published' | 'candidate' | 'proposed';
export type ProjectPatternStatus = 'not_started' | 'considering' | 'applied' | 'rejected';

export interface Pattern {
  id: number;
  name: string;
  number: string;
  scale: Scale;
  category: string;
  categoryLabel: string;
  confidence: Confidence;
  status: PatternStatus;
  problem: string;
  body: string;
  solution: string;
  connections_up: number[];
  connections_down: number[];
  reading_order: number;
  tags?: string[];
}

export interface Category {
  id: string;
  label: string;
  number: string;
  scale: string;
  description: string;
  patternIds: number[];
}

export interface ProjectPattern {
  patternId: number;
  status: ProjectPatternStatus;
  notes: string;
  addedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  patterns: ProjectPattern[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
