import { describe, expect, it } from "vitest";
import { PUBLIC_AUTH_FALLBACK, publicAuthEnvPlugin } from "../../vite.config";

describe("Published staff auth configuration", () => {
  it("inlines both public settings used by the generated client", async () => {
    const plugin = publicAuthEnvPlugin({
      VITE_SUPABASE_URL: "https://auth.example.test",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
    });
    const transform = plugin.transform;
    if (typeof transform !== "function") throw new Error("Missing transform");
    const source = "const url = import.meta.env['VITE_SUPABASE_URL']; const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']; const secret = process.env['SUPABASE_SERVICE_ROLE_KEY'];";
    const result = await transform.call({} as never, source, "/src/integrations/supabase/client.ts");
    expect(result).toBe('const url = "https://auth.example.test"; const key = "sb_publishable_test"; const secret = process.env[\'SUPABASE_SERVICE_ROLE_KEY\'];');
  });

  it("does not rewrite other modules or private environment values", async () => {
    const plugin = publicAuthEnvPlugin({ SUPABASE_SERVICE_ROLE_KEY: "private-test-value" });
    const transform = plugin.transform;
    if (typeof transform !== "function") throw new Error("Missing transform");
    const source = "process.env['SUPABASE_SERVICE_ROLE_KEY']";
    expect(await transform.call({} as never, source, "/src/integrations/supabase/client.ts")).toBe(source);
    expect(await transform.call({} as never, source, "/src/routes/auth.tsx")).toBeUndefined();
  });
});
describe("Hosted build without an env file", () => {
  it("still inlines the public backend address and publishable key", async () => {
    const original = process.cwd();
    process.chdir("/tmp");
    try {
      const plugin = publicAuthEnvPlugin({});
      const config = plugin.config;
      if (typeof config !== "function") throw new Error("Missing config");
      await config.call({} as never, {}, { mode: "production", command: "build" });
      const transform = plugin.transform;
      if (typeof transform !== "function") throw new Error("Missing transform");
      const result = await transform.call({} as never, "import.meta.env['VITE_SUPABASE_URL'] || import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']", "/src/integrations/supabase/client.ts");
      expect(result).toBe(`${JSON.stringify(PUBLIC_AUTH_FALLBACK.VITE_SUPABASE_URL)} || ${JSON.stringify(PUBLIC_AUTH_FALLBACK.VITE_SUPABASE_PUBLISHABLE_KEY)}`);
    } finally {
      process.chdir(original);
    }
  });
});
