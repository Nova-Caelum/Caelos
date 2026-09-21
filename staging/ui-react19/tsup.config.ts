import { defineConfig } from "tsup";
const shared = {
  format: ["esm" as const],
  dts: true,
  sourcemap: true,
  clean: true,
  // esbuild keeps the client banner; tsup's extra Rollup pass strips it.
  treeshake: false,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@pandacss/dev",
    /^@radix-ui\//,
    "lucide-react",
    // The approved Atlas 2 conversation header drives its split with motion's spring
    // solver (stiffness 280 / damping 34 / mass 1). Externalised so every consumer keeps
    // ONE motion instance: Atlas 2 aliases motion/react to the Caelos-console copy, while
    // Atlas 3 and the staging app resolve it from the workspace root. Bundling it here
    // would ship a second copy inside dist.
    /^motion(\/.*)?$/,
  ],
};
export default defineConfig([
  { ...shared, entry: ["src/index.ts"], banner: { js: '"use client";' } },
  { ...shared, entry: ["src/preset.ts", "src/host-recipes.ts"], clean: false },
]);
