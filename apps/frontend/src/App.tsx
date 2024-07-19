import { useState, useEffect } from "react";
import { ConnectionState } from "./ConnectionState";
import { ConnectionManager } from "./ConnectionManager";
import { Events } from "./Events";
import { socket } from "./socket";
import { MyForm } from "./MyForm";
import { Outlet } from "react-router";

export default function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [fooEvents, setFooEvents] = useState<{ name: string; data: unknown }[]>(
    []
  );

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      // socket.emit("init", { slots: 3, maxScore: 100 });
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.onAny((event, data) => {
      console.log({ event, data });
      setFooEvents((events) => [...events, { name: event, data }]);
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.offAny();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto min-h-dvh">
      <ConnectionState isConnected={isConnected} />
      <Events events={fooEvents} />
      <ConnectionManager />
      <MyForm />
      <Outlet />
    </div>
  );
}
