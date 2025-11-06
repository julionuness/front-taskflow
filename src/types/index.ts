export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  assignedTo: string; // user id
  createdBy: string; // user id
  createdAt: Date;
  updatedAt: Date;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

export interface Column {
  id: string;
  title: string;
  status: Task['status'];
  tasks: Task[];
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  tasksByUser: { userId: string; userName: string; count: number }[];
  tasksByPriority: { priority: Task['priority']; count: number }[];
  completionRate: number;
}