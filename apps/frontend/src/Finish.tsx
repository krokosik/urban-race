import clsx from "clsx";
import { useStore } from "./store";

export default function Finish() {
  const players = useStore((state) => state.game?.players) ?? [];

  return (
    <>
      <h2 className="pt-8">Koniec!</h2>
      <p className="text-center">Oto nasi najlepsi zawodnicy!</p>
      {players
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((player, idx) => (
          <div
            key={player.id}
            className={clsx(
              "box-border my-8 inline-block max-w-full overflow-hidden p-2 comic-box transition-all duration-300 ease-in-out ring-8 ring-offset-8",
              idx === 0 && "ring-yellow-200 ring-offset-yellow-300 w-[40%]",
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
        ))}
    </>
  );
}
