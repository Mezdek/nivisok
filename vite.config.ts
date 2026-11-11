import { resolve } from "path";
import { fileURLToPath } from "url";
import tsconfigPaths from "vite-plugin-tsconfig-paths";
import { defineConfig } from "vitest/config";
import pkg from "./package.json" with { type: "json" };

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  publicDir: "public",
  plugins: [tsconfigPaths()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        sidepanel: resolve(__dirname, "sidepanel.html"),
        background: resolve(__dirname, "src/background/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
      },
    },
  },

  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
});
