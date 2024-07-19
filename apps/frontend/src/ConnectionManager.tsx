import { useEffect, useState } from "react";

export function ConnectionManager() {
  const [sessionId, setSessionId] = useState("");
  const [spirits, setSpirits] = useState<string[]>([]);
  const [availableSpirits, setAvailableSpirits] = useState<string[]>([]);

  function connect() {
    socket.connect();
  }

  function disconnect() {
    socket.disconnect();
  }

  useEffect(() => {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop: any) => searchParams.get(prop),
    });

    if (params.sessionId) {
      setSessionId(params.sessionId);
    }

    socket.on("init", (sessionId) => {
      setSessionId(sessionId);
    });
    socket.on("availableSpirits", (spirits) => {
      setAvailableSpirits(spirits);
    });
    socket.on("join", (data) => {
      setSessionId(data.sessionId);
      setSpirits(data.allSpirits);
    });
    return () => {
      socket.off("init");
      socket.off("availableSpirits");
      socket.off("join");
    };
  }, []);

  return (
    <>
      <button className="btn" onClick={connect}>
        Connect
      </button>
      <button onClick={disconnect}>Disconnect</button>
      <button
        onClick={() => {
          socket.emit("init");
        }}
      >
        Init
      </button>
      <button
        onClick={() => {
          socket.emit("join", { sessionId });
        }}
      >
        Join
      </button>
      <button onClick={() => socket.emit("reset")}>Reset</button>
      {spirits.map((spirit) => (
        <button
          key={spirit}
          disabled={!availableSpirits.includes(spirit)}
          onClick={() => socket.emit("selectSpirit", { spirit, sessionId })}
        >
          {spirit}
        </button>
      ))}
    </>
  );
}
