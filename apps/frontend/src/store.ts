import type {} from "@redux-devtools/extension"; // required for devtools typing
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface State {
  game?: Game;
  setSessionId: (sessionId: string) => void;
  setGame: (game: Game) => void;
}

export interface Player {
  id: string;
  ready: boolean;
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

export const useStore = create<State>()(
  devtools((set) => ({
    game: undefined,
    setSessionId: (sessionId) => set({ sessionId }),
    setGame: (game) => set({ game }),
  }))
);
