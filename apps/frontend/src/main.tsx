import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import {
  createBrowserRouter,
  redirect,
  RouterProvider,
} from "react-router-dom";
import "./globals.css";
import { IoProvider } from "socket.io-react-hook";
import { SpiritSelect } from "./SpiritSelect.tsx";
import { Game } from "./Game.tsx";
import NoSession from "./NoSession.tsx";
import { toast, ToastContainer } from "react-toastify";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    loader: async ({ request }) => {
      const sessionId = new URL(request.url).searchParams.get("sessionId");
      const res = await fetch(`/api/app?sessionId=${sessionId}`)
        .then((res) => res.json())
        .catch(() => null);

      if (!res) {
        toast.error("Session not found.");
        return redirect("/nosession");
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
        element: <div>Finish</div>,
      },
    ],
  },
  {
    path: "nosession",
    element: <NoSession />,
  },
  {
    path: "*",
    element: <NoSession />,
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
