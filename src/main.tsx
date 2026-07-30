
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import DesignLab from "./app/DesignLab.tsx";
  import Foundry from "./app/Foundry.tsx";
  import LockedStudio from "./app/LockedStudio.tsx";
  import { shapeTheme } from "./design/deriveShape.ts";
  import { injectTokens } from "./design/inject.ts";
  import { theme } from "./design/tokens.ts";
  import "./styles/index.css";

  // URL toggles:
  //   ?lab=1    → the experimental design lab (iteration / comparison surface)
  //   ?locked=1 → the locked studio (canonical library of committed elements)
  //   ?foundry=1 → the live app with the derived-token authoring overlay
  // No toggle → the live app.
  const params = new URLSearchParams(window.location.search);
  const isLab = params.get("lab") === "1";
  const isLocked = params.get("locked") === "1";
  const isFoundry = params.get("foundry") === "1";

  // Layer A bridge: legacy --nc-* consumers now resolve through the derived
  // --sys-* color system while the migration surface remains stable.
  injectTokens([theme.css, shapeTheme.css], { legacyBridge: true });

  const root = createRoot(document.getElementById("root")!);
  if (isFoundry) {
    root.render(<><App /><Foundry /></>);
  } else if (isLocked) {
    root.render(<LockedStudio />);
  } else if (isLab) {
    root.render(<DesignLab />);
  } else {
    root.render(<App />);
  }
