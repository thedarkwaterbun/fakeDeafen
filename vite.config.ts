import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  build: {
    target: "ES2022",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "fakeDeafen",
      fileName: () => "fakeDeafen.js",
      formats: ["iife"]
    },
    rollupOptions: {
      output: {
        extend: true
      }
    }
  },
  define: {
    "process.env.NODE_ENV": '"production"'
  }
});
