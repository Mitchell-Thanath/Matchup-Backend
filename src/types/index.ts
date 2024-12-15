export interface Match {
  match_id: string;
  host_id: string;
  type: string;
  buy_in: number;
  invite_code: string;
  questions: string[];
  participants: string[];
  status: string;
  winner?: string;
}

export interface Prediction {
  prediction_id: string;
  match_id: string;
  user_id: string;
  predictions: Record<string, string>;
}

export interface User {
  user_id: string;
  name: string;
  balance: number;
}
