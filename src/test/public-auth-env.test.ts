import { describe, expect, it } from "vitest";
import { tmpdir } from "node:os";
import { PUBLIC_AUTH_FALLBACK, publicAuthEnvPlugin } from "../../vite.config";

describe("Published staff auth configuration", () => {
  it("uses server database settings for browser and server auth when they differ", async () => {
    const plugin = publicAuthEnvPlugin({
      SUPABASE_URL: "https://server-project.example.test",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_server",
      VITE_SUPABASE_URL: "https://stale-browser-project.example.test",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_stale_browser",
    });
    const transform = plugin.transform;
    if (typeof transform !== "function") throw new Error("Missing transform");
    const source =
      "const url = import.meta.env['VITE_SUPABASE_URL']; const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']; const secret = process.env['SUPABASE_SERVICE_ROLE_KEY'];";
    const result = await transform.call(
      {} as never,
      source,
      "/src/integrations/supabase/client.ts",
    );
    expect(result).toBe(
      'const url = "https://server-project.example.test"; const key = "sb_publishable_server"; const secret = process.env[\'SUPABASE_SERVICE_ROLE_KEY\'];',
    );

    const publicConfig = await transform.call(
      {} as never,
      'export const PUBLIC_SUPABASE_URL = "https://fallback.example.test"; export const PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fallback";',
      "/src/integrations/supabase/public-config.ts",
    );
    expect(publicConfig).toContain('PUBLIC_SUPABASE_URL = "https://server-project.example.test"');
    expect(publicConfig).toContain('PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_server"');
    expect(publicConfig).not.toContain("stale-browser-project");
  });

  it("builds server token verification against the same project as the browser", async () => {
    const plugin = publicAuthEnvPlugin({
      VITE_SUPABASE_URL: "https://browser-project.example.test",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_browser",
      SUPABASE_URL: "https://different-server-project.example.test",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_server",
    });
    const transform = plugin.transform;
    if (typeof transform !== "function") throw new Error("Missing transform");
    const source =
      'export const PUBLIC_SUPABASE_URL = "https://fallback.example.test"; export const PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fallback";';
    const result = await transform.call(
      {} as never,
      source,
      "/src/integrations/supabase/public-config.ts",
    );

    expect(result).toContain(
      'PUBLIC_SUPABASE_URL = "https://different-server-project.example.test"',
    );
    expect(result).toContain('PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_server"');
    expect(result).not.toContain("browser-project");
    expect(result).not.toContain("sb_publishable_browser");
  });

  it("does not rewrite other modules or private environment values", async () => {
    const plugin = publicAuthEnvPlugin({ SUPABASE_SERVICE_ROLE_KEY: "private-test-value" });
    const transform = plugin.transform;
    if (typeof transform !== "function") throw new Error("Missing transform");
    const source = "process.env['SUPABASE_SERVICE_ROLE_KEY']";
    expect(await transform.call({} as never, source, "/src/integrations/supabase/client.ts")).toBe(
      source,
    );
    expect(await transform.call({} as never, source, "/src/routes/auth.tsx")).toBeUndefined();
  });
});
describe("Hosted build without an env file", () => {
  it("still inlines the public backend address and publishable key", async () => {
    const original = process.cwd();
    const originalUrl = process.env.VITE_SUPABASE_URL;
    const originalKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    process.chdir(tmpdir());
    try {
      const plugin = publicAuthEnvPlugin({});
      const config = plugin.config;
      if (typeof config !== "function") throw new Error("Missing config");
      await config.call({} as never, {}, { mode: "production", command: "build" });
      const transform = plugin.transform;
      if (typeof transform !== "function") throw new Error("Missing transform");
      const result = await transform.call(
        {} as never,
        "import.meta.env['VITE_SUPABASE_URL'] || import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']",
        "/src/integrations/supabase/client.ts",
      );
      expect(result).toBe(
        `${JSON.stringify(PUBLIC_AUTH_FALLBACK.VITE_SUPABASE_URL)} || ${JSON.stringify(PUBLIC_AUTH_FALLBACK.VITE_SUPABASE_PUBLISHABLE_KEY)}`,
      );

      const serverConfig = await transform.call(
        {} as never,
        'export const PUBLIC_SUPABASE_URL = "old"; export const PUBLIC_SUPABASE_PUBLISHABLE_KEY = "old";',
        "/src/integrations/supabase/public-config.ts",
      );
      expect(serverConfig).toContain(
        `PUBLIC_SUPABASE_URL = ${JSON.stringify(PUBLIC_AUTH_FALLBACK.VITE_SUPABASE_URL)}`,
      );
      expect(serverConfig).toContain(
        `PUBLIC_SUPABASE_PUBLISHABLE_KEY = ${JSON.stringify(PUBLIC_AUTH_FALLBACK.VITE_SUPABASE_PUBLISHABLE_KEY)}`,
      );
    } finally {
      process.chdir(original);
      if (originalUrl === undefined) delete process.env.VITE_SUPABASE_URL;
      else process.env.VITE_SUPABASE_URL = originalUrl;
      if (originalKey === undefined) delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      else process.env.VITE_SUPABASE_PUBLISHABLE_KEY = originalKey;
    }
  });
});
