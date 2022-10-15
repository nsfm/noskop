import React from "react";
import ReactDOM from "react-dom/client";

import { Noskop } from "./Noskop";
import reportWebVitals from "./reportWebVitals";

import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <Noskop />
  </React.StrictMode>
);

reportWebVitals(console.log);
