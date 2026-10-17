import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The wrapper writes Lovable's deployable dist/ bundle in the sandbox.
// Outside Lovable, Nitro still detects hosting presets such as Vercel.
export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  vite: {
    server: { fs: { allow: [process.cwd(), "/persist/node_modules"] } },
  },
});
