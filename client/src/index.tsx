import React from "react";
import ReactDOM from "react-dom/client";

import { Noskop } from "./Noskop";
import reportWebVitals from "./reportWebVitals";

import "normalize.css/normalize.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
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
