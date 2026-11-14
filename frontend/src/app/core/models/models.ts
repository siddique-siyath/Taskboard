export const STATUSES = ['Backlog', 'Planned', 'In Progress', 'Completed'] as const;
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

export type TaskStatus = (typeof STATUSES)[number];
export type TaskPriority = (typeof PRIORITIES)[number];

export interface Task {
  id: number;
  title: string;
  description: string | null;
  storyPoints: number;
  priority: TaskPriority;
  status: TaskStatus;
  plannedDate: string; // YYYY-MM-DD
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPayload {
  title: string;
  description: string | null;
  storyPoints: number;
  priority: TaskPriority;
  status: TaskStatus;
  plannedDate: string;
  dueDate: string | null;
}

export type SortField = 'title' | 'storyPoints' | 'priority' | 'status' | 'plannedDate' | 'dueDate' | 'createdAt';

export interface TaskQuery {
  search: string;
  priority: TaskPriority | '';
  status: TaskStatus | '';
  sortBy: SortField;
  sortOrder: 'asc' | 'desc';
  page: number; // 1-based
  limit: number;
}

export interface TaskPage {
  data: Task[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CapacityUsage {
  date: string;
  weekStart: string;
  weekEnd: string;
  dailyLimit: number;
  weeklyLimit: number;
  dailyPlanned: number;
  weeklyPlanned: number;
  dailyRemaining: number;
  weeklyRemaining: number;
}

export interface Summary {
  totalTasks: number;
  backlogTasks: number;
  plannedTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  totalStoryPoints: number;
}

export interface Settings {
  dailyPointLimit: number;
  weeklyPointLimit: number;
}

export interface LoginResponse {
  token: string;
  user: { id: number; name: string; email: string };
}
