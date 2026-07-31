// ═══════════════════════════════════════════════════════════════════════════════
//  DESIGN LAB 3 — Layered-depth project card variant
// ───────────────────────────────────────────────────────────────────────────────
//  Toggle: append `?lab=3` to the URL. main.tsx swaps App→DesignLab3 on that flag.
//
//  Composition: mounts the full <App /> with two overrides —
//    (1) renderProjectView replaces the canonical ProjectView with the layered shell
//    (2) initialProjectName auto-selects VulcanDDI once data loads
//
//  Sidebar renders normally. Drawer functionality preserved (needed for Daniel's
//  "render drawer on top of card" review requirement).
//
//  Shell direction: see ProjectViewLayeredShell.tsx for design intent.
// ═══════════════════════════════════════════════════════════════════════════════

import App from "./App";
import { ProjectViewLayeredShell } from "./ProjectViewLayeredShell";

export default function DesignLab3() {
  return (
    <App
      renderProjectView={(props) => <ProjectViewLayeredShell {...props} />}
      initialProjectName="Vulcan-DDI"
    />
  );
}
