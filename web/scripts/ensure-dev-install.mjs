import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = resolve(import.meta.dirname, "..");
const viteBin = resolve(rootDir, "node_modules", ".bin", process.platform === "win32" ? "vite.cmd" : "vite");

if (existsSync(viteBin)) {
  process.exit(0);
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const install = spawnSync(npmCommand, ["install"], {
  cwd: rootDir,
  stdio: "inherit",
  env: {
    ...process.env,
    SHARP_IGNORE_GLOBAL_LIBVIPS: "1",
  },
});

if (install.status !== 0) {
  process.exit(install.status ?? 1);
}
