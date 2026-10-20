import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The wrapper writes Lovable's deployable dist/ bundle in the sandbox.
// Self-hosted builds use Vercel's Node-compatible Nitro output.
export default defineConfig({
  nitro: { preset: "vercel" },
  tanstackStart: { server: { entry: "server" } },
  vite: {
    server: { fs: { allow: [process.cwd(), "/persist/node_modules"] } },
  },
});
