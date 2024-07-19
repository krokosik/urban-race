import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProperSocket } from "./hooks";

export const Game = () => {
  const { socket } = useProperSocket();
  const [searchParams] = useSearchParams();
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const sessionId = searchParams.get("sessionId");
  const [permission, setPermission] = useState<boolean>(
    !(DeviceMotionEvent as any)?.requestPermission
  );

  const motionDetection = useCallback(
    (event: DeviceMotionEvent) => {
      const { x, y, z } = event.acceleration ?? {};
      setAcceleration({ x: x ?? 0, y: y ?? 0, z: z ?? 0 });
      socket.emit("addScore", {
        sessionId,
        score: Math.sqrt((x ?? 0) ** 2 + (y ?? 0) ** 2 + (z ?? 0) ** 2) / 1000,
      });
    },
    [sessionId, socket]
  );

  useEffect(() => {
    window.addEventListener("devicemotion", motionDetection, true);
    return () => {
      window.removeEventListener("devicemotion", motionDetection);
    };
  }, [motionDetection, permission]);

  return (
    <main className="flex flex-col items-center gap-4 p-4">
      <h1 className="text-4xl font-bold">Game</h1>
      <p>Shake to race</p>
      <p>Acceleration</p>
      <pre>{JSON.stringify(acceleration, null, 2)}</pre>
      <h2 className="text-2xl font-semibold">Total score increment</h2>
      <p>
        Score:{" "}
        {Math.sqrt(
          acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
        )}
      </p>
      {!permission && (
        <button
          className="btn"
          onClick={() => {
            // @ts-ignore
            DeviceMotionEvent.requestPermission()
              .then((response: any) => {
                // (optional) Do something after API prompt dismissed.
                if (response == "granted") {
                  setPermission(true);
                }
              })
              .catch(console.error);
          }}
        >
          Request motion permission
        </button>
      )}
    </main>
  );
};
