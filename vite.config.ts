import { defineConfig } from "vite";
import Refina from "vite-plugin-refina";

export default defineConfig({
  plugins: [Refina()],
  optimizeDeps: {
    exclude: ["refina", "@refina/basic-components", "@refina/fluentui"],
  },
});
