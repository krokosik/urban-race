import type {} from "@redux-devtools/extension"; // required for devtools typing
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface State {
  game?: Game;
  spirits: string[];
  countdownLobby?: number;
  countdownGame?: number;
  setGame: (game: Game) => void;
  setPlayers: (players: Player[]) => void;
  setSpirits: (spirits: string[]) => void;
  setCountdownLobby: (countdown: number) => void;
  setCountdownGame: (countdown: number) => void;
}

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

export const useStore = create<State>()(
  devtools((set) => ({
    game: undefined,
    spirits: [],
    setGame: (game) => set({ game }),
    setPlayers: (players) =>
      set(({ game }) => {
        if (!game) {
          return {};
        }
        return { game: { ...game, players } };
      }),
    setSpirits: (spirits) => set({ spirits }),
    setCountdownLobby: (countdownLobby) => set({ countdownLobby }),
    setCountdownGame: (countdownGame) => set({ countdownGame }),
  }))
);
