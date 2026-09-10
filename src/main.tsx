
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { derive } from "./design/derive.ts";
  import { applyCharacterCss, deriveCharacter } from "./design/deriveCharacter.ts";
  import { deriveShape } from "./design/deriveShape.ts";
  import { injectTokens } from "./design/inject.ts";
  import { applyOverride } from "./design/override.ts";
  import seedOverride from "./design/seed.override.json";
  import { DEFAULT_SEED } from "./design/seed.ts";
  import { DEFAULT_SHAPE_SEED } from "./design/shapeSeed.ts";
  import "./styles/index.css";
  import "@nova-caelum/ui/styles.css";

  // The approved shared library is the sole active design showcase.
  // Retired lab/bookmark URLs resolve to that review surface in development.
  const params = new URLSearchParams(window.location.search);
  const isRetiredShowcase = ["1", "2", "3"].includes(params.get("lab") || "")
    || params.get("locked") === "1" || params.get("primitives") === "1";
  const isFoundry = params.get("foundry") === "1" || isRetiredShowcase;

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
    } else {
      root.render(<App />);
    }
  }

  void renderRoute();
