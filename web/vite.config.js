import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://timgent.github.io/secondary-school-map/ in production,
// so built asset + data URLs need that base prefix. Dev stays at root.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/secondary-school-map/" : "/",
  plugins: [react()],
  server: { port: 5173, open: false },
}));
