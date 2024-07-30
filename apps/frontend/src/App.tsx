import { useEffect, useRef } from "react";
import { Outlet, useLoaderData, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { usePlayerId, useProperSocket } from "./hooks";
import { Game, useStore } from "./store";

import { errorPath, GameErrorType } from "./error";

export default function App() {
  const { socket } = useProperSocket();
  const playerId = usePlayerId();
  const navigate = useNavigate();
  const gameRef = useRef<Game | undefined>(useStore.getState().game);

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
    useStore.subscribe(({ game }) => void (gameRef.current = game));

    socket.on("error", (error) => {
      const errorType = error.message as GameErrorType;
      let message: string, description: string;
      switch (errorType) {
        case GameErrorType.NoSession: {
          message = "Nie znaleziono sesji";
          description = "Zeskanuj aktualny kod QR, aby spróbować ponownie.";
          break;
        }
        case GameErrorType.GameFull: {
          message = "Gra jest pełna";
          description =
            "Poczekaj na koniec wyścigu i dołącz do kolejnej rundy.";
          break;
        }
        case GameErrorType.GameStarted: {
          message = "Gra już się zaczęła";
          description =
            "Poczekaj na koniec wyścigu i dołącz do kolejnej rundy.";
          break;
        }
        case GameErrorType.SpiritNotAvailable: {
          toast.info("Wybrany duch jest już zajęty");
          return;
        }
        case GameErrorType.GameNotRunning: {
          message = "Gra się zakończyła";
          description = "Poczekaj na rozpoczęcie kolejnego wyścigu.";
          break;
        }
        case GameErrorType.PlayerNotFound: {
          message = "Nie znaleziono gracza";
          description = "Zeskanuj aktualny kod QR, aby spróbować ponownie.";
          break;
        }
        default: {
          message = "Mamy kłopot :(";
          description = "Zeskanuj aktualny kod QR, aby spróbować ponownie.";
          break;
        }
      }
      navigate(errorPath(message, description));
    });
    socket.on("allSpirits", (spirits) => actions.setSpirits(spirits));
    socket.on("start", () => {
      if (gameRef.current?.players.find((player) => player.id === playerId)) {
        navigate(`/game?sessionId=${sessionId}`);
      } else {
        navigate(
          errorPath(
            "Gra się rozpoczęła.",
            "Poczekaj na koniec wyścigu i dołącz do kolejnej rundy."
          )
        );
      }
    });
    socket.on("finish", () => navigate(`/finish?sessionId=${sessionId}`));
    socket.on("players", (players) => actions.setPlayers(players));
    socket.on("countdownLobby", ({ countdown }) =>
      actions.setCountdownLobby(countdown)
    );
    socket.on("countdownGame", ({ countdown }) =>
      actions.setCountdownGame(countdown)
    );

    socket.once("join", (data) => actions.setGame(data));
    socket.emit("join", { sessionId, playerId });

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
