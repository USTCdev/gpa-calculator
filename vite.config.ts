import { defineConfig, Plugin } from "vite";
import Refina from "vite-plugin-refina";

export default defineConfig({
  plugins: [Refina() as Plugin[]],
  optimizeDeps: {
    exclude: ["refina", "@refina/basic-components", "@refina/fluentui"],
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
});
