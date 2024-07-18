export interface Player {
  id: string;
  ready: boolean;
  score: number;
  sprite: string;
}

export interface Game {
  sessionId: string;
  players: Player[];
  slots: number;
  started: boolean;
  finished: boolean;
  maxScore: number;
}
