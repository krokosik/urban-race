import clsx from "clsx";
import { useStore } from "./store";
import { usePlayerId } from "./hooks";

export default function Finish() {
  const players =
    useStore((state) =>
      state.game?.players
        .filter((player) => !!player.time)
        .sort((a, b) => a.time! - b.time!)
        .slice(0, 3)
    ) ?? [];
  const playerId = usePlayerId();

  return (
    <>
      <h2 className="pt-8">Koniec!</h2>
      {players.length > 1 && (
        <h4 className="text-center">Oto nasi najlepsi zawodnicy!</h4>
      )}
      {players.length === 1 && (
        <h4 className="text-center">Oto nasz zwycięzca!</h4>
      )}
      {players.length === 0 && (
        <h4 className="text-center">
          Niestety, nikt nie ukończył wyścigu na czas :(
        </h4>
      )}
      {players.map((player, idx) => {
        const time = idx === 0 ? player.time! : player.time! - players[0].time!;
        const seconds = Math.floor(time / 1000)
          .toString()
          .padStart(2, "0");
        const milliseconds = (time % 1000).toString().padStart(3, "0");
        return (
          <div
            key={player.id}
            className={clsx(
              "my-8 w-full flex justify-center gap-12 items-center",
              player.id === playerId &&
                "comic-box p-6 ring-4 ring-blue-400 ring-offset-4 text-neutral"
            )}
          >
            <div
              className={clsx(
                "box-border inline-block max-w-full overflow-hidden p-2 comic-box ring-8 ring-offset-8",
                idx === 0 && "ring-yellow-200 ring-offset-yellow-300 w-[35%]",
                idx === 1 && "ring-gray-300 ring-offset-gray-400 w-[30%]",
                idx === 2 && "ring-orange-600 ring-offset-orange-700 w-[25%]"
              )}
            >
              <img
                className="m-auto aspect-square cursor-pointer select-none object-contain"
                src={`/spirits/${player.spirit}`}
                alt={`Spirit ${player.spirit} of player ${player.id}`}
              />
            </div>
            <div>
              <h3 className="tracking-wider">Czas:</h3>
              <h2>
                {idx === 0 ? "" : "+"}
                {seconds}.{milliseconds}s
              </h2>
            </div>
          </div>
        );
      })}
    </>
  );
}
