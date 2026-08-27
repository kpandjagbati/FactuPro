#!/usr/bin/env node
/**
 * Lance k6 même si le PATH Windows n'est pas à jour.
 * Usage: node load-tests/k6/run.mjs smoke|load
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const mode = process.argv[2] || "smoke";
const script =
  mode === "load"
    ? "load-tests/k6/load.js"
    : "load-tests/k6/smoke.js";

const candidates = [
  process.env.K6_BIN,
  "k6",
  path.join("C:", "Program Files", "k6", "k6.exe"),
  path.join("C:", "Program Files", "GrafanaLabs", "k6", "k6.exe"),
].filter(Boolean);

function resolveK6() {
  for (const bin of candidates) {
    if (bin === "k6") {
      const which = spawnSync(bin, ["version"], {
        encoding: "utf8",
        shell: true,
      });
      if (which.status === 0) return bin;
      continue;
    }
    if (existsSync(bin)) return bin;
  }
  return null;
}

const k6 = resolveK6();
if (!k6) {
  console.error(
    "k6 introuvable. Installe-le : winget install GrafanaLabs.k6\n" +
      "Puis rouvre le terminal, ou définis K6_BIN=\"C:\\\\Program Files\\\\k6\\\\k6.exe\"",
  );
  process.exit(1);
}

const extraEnv = { ...process.env };
if (process.env.BASE_URL) {
  // déjà passé via env npm
}

const result = spawnSync(k6, ["run", script], {
  stdio: "inherit",
  env: extraEnv,
  shell: false,
});

process.exit(result.status ?? 1);
