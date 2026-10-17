import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Nitro picks its deploy preset automatically (Vercel is detected on Vercel builds).
// Override with NITRO_PRESET=<preset> when deploying elsewhere.
export default defineConfig({
  plugins: [tsConfigPaths({ projects: ["./tsconfig.json"] }), tailwindcss(), tanstackStart(), nitro(), viteReact()],
});
