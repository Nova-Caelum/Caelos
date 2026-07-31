// ═══════════════════════════════════════════════════════════════════════════════
//  DESIGN LAB 2 — Decomposed Bento project card variant
// ───────────────────────────────────────────────────────────────────────────────
//  Toggle: append `?lab=2` to the URL. main.tsx swaps App→DesignLab2 on that flag.
//
//  Composition: mounts the full <App /> with two overrides —
//    (1) renderProjectView replaces the canonical ProjectView with the bento shell
//    (2) initialProjectName auto-selects VulcanDDI once data loads
//
//  Sidebar renders normally (Daniel's brief: "static image" = don't spend design
//  effort on it, just present it; interactions we don't need). The real Sidebar
//  gives us accurate chemistry that responds to seed changes and a working
//  drawer path for the "render drawer on top of card" requirement.
//
//  Shell direction: see ProjectViewBentoShell.tsx for design intent.
// ═══════════════════════════════════════════════════════════════════════════════

import App from "./App";
import { ProjectViewBentoShell } from "./ProjectViewBentoShell";

export default function DesignLab2() {
  return (
    <App
      renderProjectView={(props) => <ProjectViewBentoShell {...props} />}
      initialProjectName="Vulcan-DDI"
    />
  );
}
