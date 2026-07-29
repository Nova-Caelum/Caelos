
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import DesignLab from "./app/DesignLab.tsx";
  import "./styles/index.css";

  // ?lab=1 → render the component sandbox instead of the live app.
  // Cleaner than adding a router just for this. Remove the toggle when the
  // lab is retired.
  const params = new URLSearchParams(window.location.search);
  const isLab = params.get("lab") === "1";

  createRoot(document.getElementById("root")!).render(isLab ? <DesignLab /> : <App />);
