import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type Plugin } from "vite";
import {
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  PUBLIC_SUPABASE_URL,
} from "./src/integrations/supabase/public-config.ts";

// Public (non-secret) backend address and publishable key. Hosted builds may run
// without the local env file, so these keep sign-in and bookings working there.
export const PUBLIC_AUTH_FALLBACK: Record<string, string> = {
  VITE_SUPABASE_URL: PUBLIC_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

// The generated client uses bracket access, which the production env transform
// leaves unresolved. Inline only these two public values, never server secrets.
export function publicAuthEnvPlugin(env: Record<string, string>): Plugin {
  return {
    name: "public-auth-env",
    enforce: "pre",
    config(_config, { mode }) {
      env = { ...PUBLIC_AUTH_FALLBACK, ...loadEnv(mode, process.cwd(), "VITE_"), ...env };
    },
    transform(code, id) {
      const file = id.split("?")[0];
      if (file?.endsWith("/integrations/supabase/client.ts")) {
        return code.replace(
          /import\.meta\.env\[\s*(["'])(VITE_SUPABASE_URL|VITE_SUPABASE_PUBLISHABLE_KEY)\1\s*\]/g,
          (expression, _q: string, key: string) =>
            env[key] ? JSON.stringify(env[key]) : expression,
        );
      }

      // Keep server auth's public project config identical to the browser build.
      if (file?.endsWith("/integrations/supabase/public-config.ts")) {
        const publicUrl = env.VITE_SUPABASE_URL || PUBLIC_AUTH_FALLBACK.VITE_SUPABASE_URL;
        const publicKey =
          env.VITE_SUPABASE_PUBLISHABLE_KEY || PUBLIC_AUTH_FALLBACK.VITE_SUPABASE_PUBLISHABLE_KEY;
        return code
          .replace(
            /export const PUBLIC_SUPABASE_URL = "[^"]*";/,
            `export const PUBLIC_SUPABASE_URL = ${JSON.stringify(publicUrl)};`,
          )
          .replace(
            /export const PUBLIC_SUPABASE_PUBLISHABLE_KEY = "[^"]*";/,
            `export const PUBLIC_SUPABASE_PUBLISHABLE_KEY = ${JSON.stringify(publicKey)};`,
          );
      }
    },
  };
}

// The wrapper writes Lovable's deployable dist/ bundle in the sandbox.
// Self-hosted builds use Vercel's Node-compatible Nitro output.
export default defineConfig({
  nitro: { preset: "vercel" },
  tanstackStart: { server: { entry: "server" } },
  vite: {
    plugins: [publicAuthEnvPlugin({})],
    server: { fs: { allow: [process.cwd(), "/persist/node_modules"] } },
  },
});
