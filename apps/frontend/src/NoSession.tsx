import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import { useProperSocket } from "./hooks";

export default function NoSession() {
  const { socket } = useProperSocket();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  return (
    <div className="max-w-3xl mx-auto h-dvh flex flex-col justify-center items-center">
      {process.env.NODE_ENV === "development" && (
        <>
          <button
            className="btn"
            onClick={() => {
              socket.once("init", ({ sessionId }) => {
                setSearchParams({ sessionId });
                navigate(`/?sessionId=${sessionId}`);
              });
              socket.emit("init", { slots: 3, maxScore: -1 });
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
        </>
      )}
      <h3>Mamy kłopot :(</h3>
      <p className="tracking-wide">
        Zeskanuj aktualny kod QR, aby dołączyć do gry.
      </p>
    </div>
  );
}
