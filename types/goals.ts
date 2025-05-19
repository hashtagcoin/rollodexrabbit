export interface ChecklistItem {
  id: string;
  goal_id: string;
  description: string;
  is_completed: boolean;
  completed_at?: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface GoalUpdate {
  id: string;
  goal_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  target_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  checklist_items: ChecklistItem[];
  goal_updates: GoalUpdate[];
  progress?: number;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  category: string;
  target_date?: string | null;
  checklist_items: Array<{
    description: string;
    is_completed?: boolean;
    position: number;
  }>;
}

export interface UpdateGoalInput {
  id: string;
  title?: string;
  description?: string | null;
  category?: string;
  target_date?: string | null;
  is_completed?: boolean;
}
