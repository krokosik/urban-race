import { useNavigate } from "react-router";
import { useSearchParams } from "react-router-dom";
import { useProperSocket } from "./hooks";

export default function Error() {
  const { socket } = useProperSocket();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const errorMessage = searchParams.get("message") ?? "Mamy kłopot :(";
  const errorDescription =
    searchParams.get("description") ??
    "Zeskanuj aktualny kod QR, aby spróbować ponownie.";

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
      <h3>{errorMessage}</h3>
      <p className="tracking-wide">{errorDescription}</p>
    </div>
  );
}
