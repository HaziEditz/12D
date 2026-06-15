import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, mkdir, readFile } from "fs/promises";
import { execSync } from "child_process";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });
  await mkdir("dist", { recursive: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");

  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];

  const nodeBuiltins = [
    "assert", "async_hooks", "buffer", "child_process", "cluster",
    "console", "constants", "crypto", "dgram", "dns", "domain",
    "events", "fs", "fs/promises", "http", "http2", "https",
    "inspector", "module", "net", "os", "path", "perf_hooks",
    "process", "punycode", "querystring", "readline", "repl",
    "stream", "string_decoder", "sys", "timers", "tls",
    "trace_events", "tty", "url", "util", "v8", "vm",
    "worker_threads", "zlib",
  ];

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    target: "node18",
    bundle: true,
    format: "esm",
    outfile: "dist/index.mjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    external: [...allDeps, ...nodeBuiltins],
    minify: false,
    logLevel: "info",
  });

  if (process.env.NODE_ENV === "production" || process.env.RENDER === "true") {
    console.log("syncing database schema...");
    try {
      execSync("npm run db:push", {
        stdio: "inherit",
        env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: "0" },
      });
      console.log("✓ Database schema synced");
    } catch (err) {
      console.warn("⚠ Database schema sync skipped (may run on startup)");
    }
  }

  console.log("✓ Build complete");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
