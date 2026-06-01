import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

import { resolve } from "node:path";

export default function () {
  return defineConfig({
    plugins: [react()],
    test: {
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
      globals: true,
    },
    resolve: {
      alias: {
        react: resolve(__dirname, "../../node_modules/react"),
        "react-dom": resolve(__dirname, "../../node_modules/react-dom"),
      },
    },
  });
}
