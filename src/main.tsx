import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const splash = document.getElementById("splash-loader");
if (splash) {
  splash.style.opacity = "0";
  setTimeout(() => splash.remove(), 400);
}

createRoot(document.getElementById("root")!).render(<App />);
