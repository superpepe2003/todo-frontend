export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskType = 'BACKEND' | 'FRONTEND' | 'FULLSTACK' | 'OTHER';

export interface TaskProgress {
  id: number;
  taskId: number;
  userId: number;
  percentage: number;
  detail: string;
  createdAt: string;
  user?: { id: number; name: string };
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  progress: number;
  deadline?: string;
  deadlineDays?: number;
  appId: number;
  assignedToId?: number;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  assignedTo?: { id: number; name: string; email?: string };
  createdBy?: { id: number; name: string };
  app?: { id: number; name: string };
  progressLogs?: TaskProgress[];
}
