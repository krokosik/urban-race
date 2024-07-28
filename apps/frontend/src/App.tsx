import { useEffect } from "react";
import { Outlet, useLoaderData, useNavigate } from "react-router";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useProperSocket } from "./hooks";
import { Game, useStore } from "./store";

export default function App() {
  const { socket } = useProperSocket();
  const navigate = useNavigate();

  const rawGame = useLoaderData() as Game;
  const state = useStore();

  useEffect(() => {
    state.setGame(rawGame);

    socket.on("error", (error) => {
      toast.error(error.message);
      navigate("/nosession");
    });

    socket.once("join", (data) => {
      state.setGame(data);
    });
    socket.on("availableSpirits", (spirits) => {
      state.setAvailableSpirits(spirits);
    });
    socket.on("allSpirits", (spirits) => {
      state.setSpirits(spirits);
    });
    socket.on("start", () => {
      navigate(`/game?sessionId=${state.game?.sessionId}`);
    });
    socket.on("finish", () => {
      navigate(`/finish?sessionId=${state.game?.sessionId}`);
    });
    socket.on("players", (players) => {
      state.setGame({ ...state.game!, players });
    });

    socket.emit("join", { sessionId: state.game?.sessionId });

    return () => {
      socket.off("join");
      socket.off("availableSpirits");
      socket.off("allSpirits");
      socket.off("start");
      socket.off("finish");
      socket.off("players");
      socket.off("error");
    };
  }, [socket, state.game?.sessionId]);

  return (
    <div className="max-w-3xl mx-auto h-dvh">
      <main className="flex flex-col gap-4 items-center justify-center size-full px-4">
        <Outlet />
      </main>
    </div>
  );
}
