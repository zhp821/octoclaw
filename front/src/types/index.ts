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

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
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
  
  globalSessionId?: string;
  dir?: string;
}

export interface ProjectData {
  roots: TaskNode[];
  agents: Agent[];
}
