import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useProperSocket } from "./hooks";
import { useStore } from "./store";

export default function App() {
  const { socket, connected } = useProperSocket();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const state = useStore();

  useEffect(() => {
    if (!connected || window.location.pathname !== "/") return;

    if (!sessionId) {
      navigate("/nosession");
    }

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
      navigate(`/game?${searchParams.toString()}`);
    });
    socket.on("finish", () => {
      navigate(`/finish?${searchParams.toString()}`);
    });
    socket.on("players", (players) => {
      state.setGame({ ...state.game!, players });
    });

    socket.emit("join", { sessionId });

    return () => {
      socket.off("join");
      socket.off("availableSpirits");
      socket.off("allSpirits");
      socket.off("start");
      socket.off("finish");
      socket.off("players");
      socket.off("error");
    };
  }, [connected, sessionId]);

  useEffect(() => {
    if (state.game && window.location.pathname === "/") {
      if (state.game.started) {
        toast.error("Game already started.");
        navigate("/nosession");
      } else {
        navigate(`/select?${searchParams.toString()}`);
      }
    } else {
      navigate(`/?${searchParams.toString()}`);
    }
  }, [!!state.game, sessionId]);

  return (
    <div className="max-w-3xl mx-auto h-dvh">
      <button
        className="btn"
        onClick={() => {
          socket.once("init", ({ sessionId }) => {
            setSearchParams({ sessionId });
          });
          socket.emit("init", { slots: 4, maxScore: 10 });
        }}
      >
        Init
      </button>
      <button
        className="btn"
        onClick={() => {
          socket.emit("reset");
          setSearchParams({});
          navigate("/");
        }}
      >
        Reset
      </button>
      {!state.game && window.location.pathname === "/" && (
        <div className="size-full flex flex-col gap-8 justify-center items-center">
          <span className="loading loading-spinner size-20"></span>
          <span className="text-white text-xl">Connecting to server...</span>
        </div>
      )}
      <main className="flex flex-col gap-4 items-center justify-center size-full px-4">
        <Outlet />
      </main>
      <ToastContainer position="bottom-center" theme="dark" />
    </div>
  );
}
