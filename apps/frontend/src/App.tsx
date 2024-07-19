import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSocket } from "socket.io-react-hook";
import { useShallow } from "zustand/react/shallow";
import { ConnectionState } from "./ConnectionState";
import { useStore } from "./store";

export default function App() {
  const { socket, connected } = useSocket(
    // @ts-ignore
    process.env.NODE_ENV === "production" ? undefined : "http://localhost:3000"
  );
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const { gameInProgress, setGame } = useStore(
    useShallow((state) => ({
      gameInProgress: !!state.game,
      setGame: state.setGame,
    }))
  );

  useEffect(() => {
    if (!connected || window.location.pathname !== "/") return;

    if (!sessionId) {
      toast.error("No session ID provided. Try scanning the QR code again.");
    }

    socket.on("error", (error) => {
      toast.error(error.message);
    });

    socket.once("join", (data) => {
      setGame(data);
    });

    socket.emit("join", { sessionId });

    return () => {
      socket.off("error");
    };
  }, [connected, sessionId]);

  useEffect(() => {
    if (gameInProgress && window.location.pathname === "/") {
      navigate(`/select?${searchParams.toString()}`);
    } else {
      navigate(`/?${searchParams.toString()}`);
    }
  }, [gameInProgress]);

  return (
    <div className="max-w-3xl mx-auto min-h-dvh m-8">
      <button
        className="btn"
        onClick={() => {
          socket.once("init", (sessionId) => {
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
        }}
      >
        Reset
      </button>
      <ConnectionState isConnected={connected} />
      {!gameInProgress && (
        <span className="loading loading-spinner loading-lg"></span>
      )}
      {/* <Events events={[]} /> */}
      {/* <ConnectionManager /> */}
      {/* <MyForm /> */}
      <Outlet />
      <ToastContainer />
    </div>
  );
}
