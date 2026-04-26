import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(rootDir, "dist/server/index.js");
const target = resolve(rootDir, "dist/server/server.js");

await mkdir(dirname(target), { recursive: true });
await copyFile(source, target);
