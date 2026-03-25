import type { Timestamp } from '@/utils/timestamp'
export type { Timestamp } from '@/utils/timestamp'

export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done' | 'cancel';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export interface QualityGate {
  enabled: boolean;
  description: string;
  schema?: string;
}

export interface TaskChanges {
  title?: string;
  description?: string;
  steps?: string[];
  assigneeId?: string;
  qualityGate?: QualityGate;
  dependencies?: string[];
  status?: TaskStatus;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Timestamp;
  relatedAction?: 'decompose' | 'modify' | 'create';
  pendingChanges?: TaskChanges;
  metadata?: Record<string, unknown>;
}

export interface TaskNode {
  id: string;
  parentId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  level: number;
  numbering: string;
  order: number;
  dependencies: string[];
  children: TaskNode[];
  assignee?: Agent;
  qualityGate: QualityGate;
  steps: string[];
  chatHistory: ChatMessage[];
  isDecomposing?: boolean;
  requiresReview: boolean;
  
  agentId?: string;
  
  executionSessionId?: string;
  executionAgentId?: string;
  executionMessages?: ChatMessage[];
  executionRetryCount?: number;
}

export interface PlanData {
  id: string;
  title: string;
  status: TaskStatus;
  order?: number;
  
  globalSessionId?: string;
  globalMessages?: ChatMessage[];
  
  children: TaskNode[];
}

export interface ProjectData {
  roots: TaskNode[];
  agents: Agent[];
}
