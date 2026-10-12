import { rm } from "node:fs/promises";

// Next always rebuilds `.next`. OpenNext invokes the app's `build` script
// after creating `.open-next/.build`, so that inner invocation must preserve
// OpenNext's workspace.
const paths = [".next"];

if (!process.argv.includes("--next-only")) {
  paths.push(".open-next");
}

await Promise.all(paths.map((path) => rm(path, { recursive: true, force: true })));
