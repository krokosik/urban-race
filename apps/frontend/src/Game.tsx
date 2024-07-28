import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProperSocket } from "./hooks";

export const Game = () => {
  const { socket } = useProperSocket();
  const [searchParams] = useSearchParams();
  const [timeToStart, setTimeToStart] = useState<number>(5);
  const sessionId = searchParams.get("sessionId");
  const [score, setScore] = useState<number>(0);

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
    setScore((prev) => prev + Math.sqrt(x! ** 2 + y! ** 2 + z! ** 2) / 1000);
  }, []);

  useEffect(() => {
    if (timeToStart > 0) {
      return;
    }
    const interval = setInterval(() => {
      socket.emit("addScore", {
        sessionId,
        score,
      });
      setScore(0);
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
      <h1 className="text-7xl" style={{ "--value": timeToStart }}></h1>
    </span>
  ) : (
    <h1 className="text-7xl animate-shake">Go!</h1>
  );
};
