import { User } from './user.model';
import { Task } from './task.model';

export interface AppMember {
  id: number;
  appId: number;
  userId: number;
  joinedAt: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

export interface App {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members?: AppMember[];
  tasks?: Task[];
}
