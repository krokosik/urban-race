import { Socket } from "socket.io-client";
import { useSocket } from "socket.io-react-hook";

export const useProperSocket = (): { socket: Socket; connected: boolean } => {
  return useSocket(
    // @ts-ignore
    process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000"
  );
};

export const usePlayerId = (): string => {
  let playerId = sessionStorage.getItem("playerId");

  if (!playerId) {
    playerId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    sessionStorage.setItem("playerId", playerId);
  }

  return playerId;
};
