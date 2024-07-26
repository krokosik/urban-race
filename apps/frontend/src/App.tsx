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

  const [searchParams] = useSearchParams();
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
    <div className="max-w-3xl mx-auto h-dvh">
      {!state.game && (
        <div className="size-full flex flex-col gap-8 justify-center items-center">
          <span className="loading loading-spinner size-20"></span>
          <span className="text-white text-lg">Connecting to server...</span>
        </div>
      )}
      <Outlet />
      <ToastContainer position="bottom-center" theme="dark" />
    </div>
  );
}
