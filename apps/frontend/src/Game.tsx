import { useCallback, useEffect, useRef, useState } from "react";
import { useProperSocket } from "./hooks";
import { useStore } from "./store";

export const Game = () => {
  const { socket } = useProperSocket();
  const [timeToStart, setTimeToStart] = useState<number>(5);
  const sessionId = useStore((state) => state.game?.sessionId);
  const score = useRef<number>(0);

  useEffect(() => {
    if (timeToStart === 0) {
      return;
    }
    const timeout = setTimeout(() => {
      setTimeToStart((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [timeToStart]);

  const motionDetection = useCallback((event: DeviceMotionEvent) => {
    const { x = 0, y = 0, z = 0 } = event.acceleration ?? {};
    score.current += Math.sqrt(x! ** 2 + y! ** 2 + z! ** 2) / 1000;
  }, []);

  useEffect(() => {
    if (timeToStart > 0) {
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
  }, [motionDetection, timeToStart, sessionId, socket]);

  return timeToStart > 0 ? (
    <span className="countdown">
      {/* @ts-ignore */}
      <h1 style={{ "--value": timeToStart }}></h1>
    </span>
  ) : (
    <h1 className="animate-shake">Jazda!</h1>
  );
};
