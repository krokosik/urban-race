import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./globals.css";
import { IoProvider } from "socket.io-react-hook";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "select",
        element: <div>About</div>,
      },
      {
        path: "game",
        element: <div>Contact</div>,
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
