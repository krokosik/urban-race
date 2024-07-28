import clsx from "clsx";
import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProperSocket } from "./hooks";
import { useStore } from "./store";

export const SpiritSelect = () => {
  const { spirits, availableSpirits } = useStore();
  const { socket } = useProperSocket();
  const [selectedSpirit, setSelectedSpirit] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [permission, setPermission] = useState<boolean>(
    !(DeviceMotionEvent as any)?.requestPermission
  );

  const requestPermission = useCallback(() => {
    // @ts-ignore
    DeviceMotionEvent.requestPermission()
      .then((response: any) => {
        // (optional) Do something after API prompt dismissed.
        if (response == "granted") {
          setPermission(true);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <h1 className="text-5xl pt-8">Select your racer!</h1>
      <p className="text-center tracking-wide">
        Racing will involve shaking your device as hard as you can!
        <br />
        Give it your best and become the champion!
      </p>
      {permission ? (
        <div className="grid grid-flow-row gap-4 grid-cols-2 py-4">
          {spirits.map((spirit) => (
            <button
              key={spirit}
              disabled={!availableSpirits.includes(spirit)}
              className={clsx(
                "box-border inline-block max-w-full overflow-hidden p-2 comic-box transition-all duration-300 ease-in-out",
                !availableSpirits.includes(spirit) &&
                  selectedSpirit !== spirit &&
                  "brightness-50 grayscale",
                selectedSpirit === spirit &&
                  "ring-8 ring-blue-300 ring-offset-8"
              )}
              onClick={() => {
                setSelectedSpirit(spirit);
                socket.emit("selectSpirit", { sessionId, spirit });
              }}
            >
              <img
                className="m-auto aspect-square cursor-pointer select-none object-contain"
                src={`/spirits/${spirit}`}
                alt={spirit}
              />
            </button>
          ))}
        </div>
      ) : (
        <button
          className="btn text-xl tracking-wider"
          onClick={requestPermission}
        >
          Request motion permission
        </button>
      )}

      {
        <div
          className={clsx(
            selectedSpirit ? "opacity-100" : "opacity-0",
            "w-full text-center"
          )}
        >
          <span className="mt-2 loading loading-spinner loading-lg"></span>
          <h2 className="text-xl">Waiting for others...</h2>
        </div>
      }
    </>
  );
};
