import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  redirect,
  RouterProvider,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { IoProvider } from "socket.io-react-hook";
import App from "./App.tsx";
import Error from "./Error.tsx";
import Finish from "./Finish.tsx";
import { Game } from "./Game.tsx";
import { SpiritSelect } from "./SpiritSelect.tsx";
import { errorPath } from "./error.ts";

import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <Error />,
    loader: async ({ request }) => {
      const sessionId = new URL(request.url).searchParams.get("sessionId");
      const res = await fetch(`/api/app?sessionId=${sessionId}`)
        .then((res) => res.json())
        .catch(() => null);

      if (!res) {
        return redirect(
          errorPath(
            "Nie odnaleziono sesji",
            "Spróbuj ponownie zeskanować kod QR."
          )
        );
      }
      return res;
    },
    children: [
      {
        index: true,
        loader: ({ request }) =>
          redirect(
            `/select?sessionId=${new URL(request.url).searchParams.get("sessionId")}`
          ),
      },
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
        element: <Finish />,
      },
    ],
  },
  {
    path: "error",
    element: <Error />,
  },
  {
    path: "*",
    element: <Error />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IoProvider>
      <RouterProvider router={router} />
    </IoProvider>
    <ToastContainer position="bottom-center" theme="dark" />
  </React.StrictMode>
);
