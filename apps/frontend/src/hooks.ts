import { Socket } from "socket.io-client";
import { useSocket } from "socket.io-react-hook";

export const useProperSocket = (): { socket: Socket; connected: boolean } => {
  return useSocket(
    // @ts-ignore
    process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000"
  );
};
