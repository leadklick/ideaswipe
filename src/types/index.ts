export interface Idea {
  id: string;
  title: string;
  tagline: string;
  problem: string;
  solution: string;
  market: string;
  score: number;
  category: string;
  regions: string[];
  mvp_weeks: number;
  competitors: string[];
  why_now: string;
}

export type SwipeDirection = 'left' | 'right' | 'up';

export interface SavedIdea {
  id: string;
  user_id: string;
  idea: Idea;
  created_at: string;
}
