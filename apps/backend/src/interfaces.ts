export interface Player {
  id: string;
  score: number;
  spirit: string;
  time?: number;
}

export interface Game {
  sessionId: string;
  players: Player[];
  slots: number;
  started: boolean;
  finished: boolean;
  maxScore: number;
  raceTime: number;
  countdownLobby: number;
  countdownGame: number;
  secondDurationMs: number;
}

export enum GameErrorType {
  NoSession = 'NoSession',
  GameFull = 'GameFull',
  GameStarted = 'GameStarted',
  SpiritNotAvailable = 'SpiritNotAvailable',
  GameNotRunning = 'GameNotRunning',
  PlayerNotFound = 'PlayerNotFound',
}

export class GameError extends Error {
  constructor(public type: GameErrorType) {
    super(type);
  }
}
