import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./globals.css";
import { IoProvider } from "socket.io-react-hook";
import { SpiritSelect } from "./SpiritSelect.tsx";
import { Game } from "./Game.tsx";
import NoSession from "./NoSession.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "select",
        element: <SpiritSelect />,
      },
      {
        path: "game",
        element: <Game />,
      },
      {
        path: "finish",
        element: <div>Finish</div>,
      },
      {
        path: "nosession",
        element: <NoSession />,
      },
      {
        path: "*",
        element: <NoSession />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IoProvider>
      <RouterProvider router={router} />
    </IoProvider>
  </React.StrictMode>
);
