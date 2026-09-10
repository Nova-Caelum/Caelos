import { defineConfig } from "@pandacss/dev";
import preset from "./src/preset";
export default defineConfig({
  preflight: false,
  prefix: "caelos",
  presets: [preset],
  include: ["./src/**/*.{ts,tsx,js,jsx}"],
  outdir: "styled-system",
  staticCss: {
    recipes: {
      foundation: ["*"],
      typography: ["*"],
      overlay: ["*"],
      avatar: ["*"],
      identity: ["*"],
      disclosure: ["*"],
      button: ["*"],
      card: ["*"],
      chip: ["*"],
      row: ["*"],
      tooltip: ["*"],
      field: ["*"],
      menu: ["*"],
      scroll: ["*"],
    },
  },
});
