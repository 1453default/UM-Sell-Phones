import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type Plugin } from "vite";

// The generated client uses bracket access, which the production env transform
// leaves unresolved. Inline only these two public values, never server secrets.
export function publicAuthEnvPlugin(env: Record<string, string>): Plugin {
  return {
    name: "public-auth-env",
    enforce: "pre",
    transform(code, id) {
      if (!id.split("?")[0]?.endsWith("/integrations/supabase/client.ts")) return;
      return code.replace(/import\.meta\.env\['(VITE_SUPABASE_URL|VITE_SUPABASE_PUBLISHABLE_KEY)'\]/g,
        (expression, key: string) => env[key] ? JSON.stringify(env[key]) : expression);
    },
  };
}

// The wrapper writes Lovable's deployable dist/ bundle in the sandbox.
// Outside Lovable, Nitro still detects hosting presets such as Vercel.
export default defineConfig(({ mode }) => ({
    plugins: [publicAuthEnvPlugin(loadEnv(mode, process.cwd(), "VITE_"))],
    server: { fs: { allow: [process.cwd(), "/persist/node_modules"] } },
}));
