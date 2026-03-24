export type TaskStatus = 'todo' | 'in-progress' | 'blocked' | 'done';

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
  timestamp: number;
  relatedAction?: 'decompose' | 'modify' | 'create';
  pendingChanges?: TaskChanges;
}

export interface TaskNode {
  id: string;
  parentId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  level: number;
  numbering: string;
  dependencies: string[];
  children: TaskNode[];
  assignee?: Agent;
  qualityGate: QualityGate;
  steps: string[];
  chatHistory: ChatMessage[];
  isDecomposing?: boolean;
  requiresReview: boolean; // 是否需要人工审核
}

export interface ProjectData {
  roots: TaskNode[];
  agents: Agent[];
}
