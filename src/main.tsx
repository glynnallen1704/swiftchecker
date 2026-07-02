import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./shyft/tokens.css";
import "./shyft/shyft.css";
import "./app.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
