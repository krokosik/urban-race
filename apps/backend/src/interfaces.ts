export interface Player {
  id: string;
  score: number;
  spirit: string;
}

export interface Game {
  sessionId: string;
  players: Player[];
  slots: number;
  started: boolean;
  finished: boolean;
  maxScore: number;
}
