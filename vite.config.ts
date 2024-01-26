import { defineConfig, Plugin } from "vite";
import Refina from "vite-plugin-refina";
import Legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    Legacy({
      targets: ["defaults", "not IE 11"],
    }),
    Refina() as Plugin[],
  ],
  optimizeDeps: {
    exclude: ["refina", "@refina/basic-components", "@refina/fluentui"],
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
});
