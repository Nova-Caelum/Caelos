
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import DesignLab from "./app/DesignLab.tsx";
  import LockedStudio from "./app/LockedStudio.tsx";
  import { derive } from "./design/derive.ts";
  import { applyCharacterCss, deriveCharacter } from "./design/deriveCharacter.ts";
  import { deriveShape } from "./design/deriveShape.ts";
  import { injectTokens } from "./design/inject.ts";
  import { applyOverride } from "./design/override.ts";
  import seedOverride from "./design/seed.override.json";
  import { DEFAULT_SEED } from "./design/seed.ts";
  import { DEFAULT_SHAPE_SEED } from "./design/shapeSeed.ts";
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
  const stagedSeeds = applyOverride(DEFAULT_SEED, DEFAULT_SHAPE_SEED, seedOverride);
  injectTokens([derive(stagedSeeds.color).css, deriveShape(stagedSeeds.shape).css], { legacyBridge: true });
  applyCharacterCss(deriveCharacter(stagedSeeds.character, stagedSeeds.color));

  const root = createRoot(document.getElementById("root")!);
  async function renderRoute() {
    if (isFoundry && import.meta.env.DEV) {
      const { default: Foundry } = await import("./app/Foundry.tsx");
      root.render(<><App foundryMode /><Foundry /></>);
    } else if (isLocked) {
      root.render(<LockedStudio />);
    } else if (isLab) {
      root.render(<DesignLab />);
    } else {
      root.render(<App />);
    }
  }

  void renderRoute();
