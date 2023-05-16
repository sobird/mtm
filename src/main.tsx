import React from "react";
import ReactDOM from "react-dom/client";
import Entry from "./Entry";
import App from "./App";
import AppWithLayout from './AppWithLayout';
import "./index.scss";


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Entry>
      <AppWithLayout />
    </Entry>
  </React.StrictMode>
);
