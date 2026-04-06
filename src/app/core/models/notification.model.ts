export interface Notification {
  id: number;
  userId: number;
  taskId?: number;
  message: string;
  read: boolean;
  createdAt: string;
  task?: { id: number; title: string };
}
