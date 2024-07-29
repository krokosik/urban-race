import { useCallback, useEffect, useRef } from "react";
import { useProperSocket } from "./hooks";
import { useStore } from "./store";

export const Game = () => {
  const { socket } = useProperSocket();
  const countdownGame = useStore((state) => state.countdownGame ?? 1000);
  const sessionId = useStore((state) => state.game?.sessionId);
  const score = useRef<number>(0);

  const motionDetection = useCallback((event: DeviceMotionEvent) => {
    const { x = 0, y = 0, z = 0 } = event.acceleration ?? {};
    score.current += Math.sqrt(x! ** 2 + y! ** 2 + z! ** 2) / 1000;
  }, []);

  useEffect(() => {
    if (countdownGame > 0) {
      return;
    }
    const interval = setInterval(() => {
      socket.emit("addScore", {
        sessionId,
        score: score.current,
      });
      score.current = 0;
    }, 500);

    window.addEventListener("devicemotion", motionDetection, true);
    return () => {
      clearInterval(interval);
      window.removeEventListener("devicemotion", motionDetection);
    };
  }, [motionDetection, countdownGame > 0, sessionId, socket]);

  if (countdownGame > 3) {
    return <h1 className="animate-pulse">Przygotuj się!</h1>;
  }

  return countdownGame > 0 ? (
    <span className="countdown">
      {/* @ts-ignore */}
      <h1 style={{ "--value": countdownGame }}></h1>
    </span>
  ) : (
    <h1 className="animate-shake">Jazda!</h1>
  );
};
