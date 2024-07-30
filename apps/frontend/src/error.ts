export const errorPath = (message: string, description: string) => {
  const errorParams = new URLSearchParams({ message, description });
  return `/error?${errorParams.toString()}`;
};

export enum GameErrorType {
  NoSession = "NoSession",
  GameFull = "GameFull",
  GameStarted = "GameStarted",
  SpiritNotAvailable = "SpiritNotAvailable",
  GameNotRunning = "GameNotRunning",
  PlayerNotFound = "PlayerNotFound",
}
