import clsx from "clsx";
import { useCallback, useState } from "react";
import { useProperSocket } from "./hooks";
import { useStore } from "./store";

export const SpiritSelect = () => {
  const { socket } = useProperSocket();
  const spirits = useStore((state) => state.spirits);
  const takenSpirits = useStore((state) =>
    state.game?.players.map((player) => player.spirit)
  );
  const selectedSpirit = useStore(
    (state) =>
      state.game?.players.find((player) => player.id === socket.id)?.spirit
  );
  const countdownLobby = useStore((state) => state.countdownLobby);
  const sessionId = useStore((state) => state.game?.sessionId);
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

  const selectSpirit = useCallback(
    (spirit: string) => () => {
      socket.emit("selectSpirit", { sessionId, spirit });
    },
    [sessionId, socket]
  );

  return (
    <>
      <h2 className="pt-8 text-center">Wybierz swojego zawodnika!</h2>
      <p className="text-center">
        Wyścig będzie polegał na potrząsaniu telefonem tak jakbyś biegł.
        <br />
        Daj z siebie wszystko i zostań mistrzem!
      </p>
      {permission ? (
        <div className="grid grid-flow-row gap-4 grid-cols-2 py-4 w-full flex-grow-0 flex-shrink basis-full">
          {spirits.map((spirit) => (
            <button
              key={spirit}
              disabled={takenSpirits?.includes(spirit)}
              className={clsx(
                "box-border inline-block max-w-full overflow-hidden p-2 comic-box transition-all duration-300 ease-in-out min-w-full aspect-square",
                takenSpirits?.includes(spirit) &&
                  selectedSpirit !== spirit &&
                  "brightness-50 grayscale",
                selectedSpirit === spirit &&
                  "ring-8 ring-blue-300 ring-offset-8"
              )}
              onClick={selectSpirit(spirit)}
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
          Zezwól na użycie akcelerometru
        </button>
      )}

      {
        <div
          className={clsx(
            countdownLobby ? "opacity-100" : "opacity-0",
            "w-full text-center mb-8 flex-1"
          )}
        >
          <h3>{countdownLobby}</h3>
          <p>Czekamy na innych...</p>
        </div>
      }
    </>
  );
};
