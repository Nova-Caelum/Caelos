import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts", "src/preset.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@pandacss/dev",
    /^@radix-ui\//,
    "lucide-react",
  ],
});
