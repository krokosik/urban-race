import { useCallback, useEffect, useRef } from "react";
import { usePlayerId, useProperSocket } from "./hooks";
import { useStore } from "./store";
import clsx from "clsx";

export const Game = () => {
  const { socket } = useProperSocket();
  const countdownGame = useStore((state) => state.countdownGame ?? 1000);
  const sessionId = useStore((state) => state.game?.sessionId);
  const score = useRef<number>(0);
  const playerId = usePlayerId();
  const player = useStore((state) =>
    state.game?.players.find((p) => p.id === playerId)
  );

  const motionDetection = useCallback((event: DeviceMotionEvent) => {
    const { x = 0, y = 0, z = 0 } = event.acceleration ?? {};
    score.current += Math.sqrt(x! ** 2 + y! ** 2 + z! ** 2) / 1000;
  }, []);

  useEffect(() => {
    if (countdownGame > 0 || player?.time) {
      return;
    }
    const interval = setInterval(() => {
      socket.emit("addScore", {
        sessionId,
        playerId,
        score: score.current,
      });
      score.current = 0;
    }, 250);

    window.addEventListener("devicemotion", motionDetection, true);
    return () => {
      clearInterval(interval);
      window.removeEventListener("devicemotion", motionDetection);
    };
  }, [motionDetection, countdownGame > 0, sessionId, socket, player?.time]);

  if (countdownGame > 3) {
    return <h1 className="animate-pulse text-center">Przygotuj się!</h1>;
  } else if (countdownGame > 0) {
    return (
      <span className="countdown">
        {/* @ts-ignore */}
        <h1 style={{ "--value": countdownGame }}></h1>
      </span>
    );
  } else if (!player?.time) {
    return (
      <div className="flex flex-col w-full items-center animate-shake">
        <div
          className={clsx(
            "box-border inline-block w-2/5 overflow-hidden p-2 comic-box transition-all duration-300 ease-in-out aspect-square",
            "ring-8 ring-blue-300 ring-offset-8"
          )}
        >
          <img
            className="m-auto aspect-square cursor-pointer select-none object-contain"
            src={`/spirits/${player!.spirit}`}
            alt={player!.spirit}
          />
        </div>
        <h1 className="mt-8">Jazda!</h1>
      </div>
    );
  } else {
    return <h1 className="animate-pulse text-center">Koniec!</h1>;
  }
};
