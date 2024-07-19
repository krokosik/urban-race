import clsx from "clsx";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProperSocket } from "./hooks";
import { useStore } from "./store";

export const SpiritSelect = () => {
  const { spirits, availableSpirits } = useStore();
  const { socket } = useProperSocket();
  const [selectedSpirit, setSelectedSpirit] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  return (
    <main className="flex flex-col gap-4 items-center w-full px-4">
      <h1 className="text-4xl font-bold">Select your racer!</h1>
      <div className="divider mx-8"></div>
      <div className="grid grid-flow-row gap-4 grid-cols-2">
        {spirits.map((spirit) => (
          <button
            key={spirit}
            disabled={!availableSpirits.includes(spirit)}
            className={clsx(
              "box-border inline-block max-w-full overflow-hidden p-2 glass rounded-md transition-all duration-300 ease-in-out",
              !availableSpirits.includes(spirit) && "opacity-50",
              selectedSpirit === spirit && "ring ring-blue-500 ring-offset-2"
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
      {selectedSpirit && (
        <>
          <h2 className="text-lg font-semibold mt-8">Waiting for others...</h2>
          <div className="loading loading-spinner loading-sm"></div>
        </>
      )}
    </main>
  );
};
