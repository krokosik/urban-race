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
      toast.error("No session ID provided. Try scanning the QR code again.");
    }

    socket.on("error", (error) => {
      toast.error(error.message);
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

    socket.emit("join", { sessionId });

    return () => {
      socket.off("error");
    };
  }, [connected, sessionId]);

  useEffect(() => {
    if (state.game && window.location.pathname === "/") {
      navigate(`/select?${searchParams.toString()}`);
    } else {
      navigate(`/?${searchParams.toString()}`);
    }
  }, [!!state.game, sessionId]);

  return (
    <div className="max-w-3xl mx-auto min-h-dvh">
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
      {!state.game && (
        <span className="loading loading-spinner loading-lg"></span>
      )}
      <Outlet />
      <ToastContainer position="bottom-center" theme="dark" />
    </div>
  );
}
