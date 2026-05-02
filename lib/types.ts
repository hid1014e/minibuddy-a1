export type ChallengeStatus = 'active' | 'completed';
export type DayStatus = 'done' | 'not_done';
export type ReactionType = 'clap';

export type MiniChallenge = {
  id: string;
  owner_user_id: string;
  theme: string | null;
  goal: string | null;
  started_at: string;
  completed_at: string | null;
  status: ChallengeStatus;
};

export type MiniChallengeDay = {
  id: string;
  mini_challenge_id: string;
  day_number: number;
  plan: string;
  status: DayStatus;
  next_step: string | null;
  image_url: string | null;
  updated_at: string;
};

export type UserProfile = {
  user_id: string;
  nickname: string;
  created_at: string;
};

export type OthersDayPost = {
  id: string;
  owner_user_id: string;
  plan: string;
  status: DayStatus;
  day_number: number;
  nickname: string;
  theme: string | null;
  image_url: string | null;
  check_count: number;
  already_checked: boolean;
};
