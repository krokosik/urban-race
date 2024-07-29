import { useEffect } from "react";
import { Outlet, useLoaderData, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { useProperSocket } from "./hooks";
import { Game, useStore } from "./store";

import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const { socket } = useProperSocket();
  const navigate = useNavigate();

  const rawGame = useLoaderData() as Game;
  const actions = useStore(
    ({
      setCountdownGame,
      setCountdownLobby,
      setGame,
      setPlayers,
      setSpirits,
    }) => ({
      setCountdownGame,
      setCountdownLobby,
      setGame,
      setPlayers,
      setSpirits,
    })
  );
  const sessionId = useStore((state) => state.game?.sessionId);

  useEffect(() => {
    actions.setGame(rawGame);

    socket.on("error", (error) => {
      toast.error(error.message);
      navigate("/nosession");
    });
    socket.on("allSpirits", (spirits) => actions.setSpirits(spirits));
    socket.on("start", () => navigate(`/game?sessionId=${sessionId}`));
    socket.on("finish", () => navigate(`/finish?sessionId=${sessionId}`));
    socket.on("players", (players) => actions.setPlayers(players));
    socket.on("countdown-lobby", ({ countdown }) =>
      actions.setCountdownLobby(countdown)
    );
    socket.on("countdown-game", ({ countdown }) =>
      actions.setCountdownGame(countdown)
    );

    socket.once("join", (data) => actions.setGame(data));
    socket.emit("join", { sessionId: sessionId });

    return () => {
      socket.off("join");
      socket.off("availableSpirits");
      socket.off("allSpirits");
      socket.off("start");
      socket.off("finish");
      socket.off("players");
      socket.off("error");
    };
  }, [socket, sessionId]);

  return (
    <div className="max-w-3xl mx-auto h-dvh">
      <main className="flex flex-col gap-4 items-center justify-center size-full px-4">
        <Outlet />
      </main>
    </div>
  );
}
