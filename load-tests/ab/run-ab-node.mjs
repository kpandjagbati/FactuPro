#!/usr/bin/env node
/**
 * Apache Bench–like runner (Node) pour Windows sans `ab` installé.
 * Même usage d’esprit : -n requêtes, -c concurrence, une URL.
 *
 * Usage:
 *   node load-tests/ab/run-ab-node.mjs
 *   node load-tests/ab/run-ab-node.mjs https://factu-pro-theta.vercel.app
 *   AB_N=200 AB_C=20 node load-tests/ab/run-ab-node.mjs http://localhost:3000
 */

const BASE = (process.argv[2] || "https://factu-pro-theta.vercel.app").replace(
  /\/$/,
  "",
);
const N = Number(process.env.AB_N || 100);
const C = Number(process.env.AB_C || 10);
const PATHS = ["/", "/sign-in", "/sign-up"];

async function fetchOne(url) {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "FactuPro-ab-node/1.0" },
    });
    await res.arrayBuffer();
    return {
      ok: res.status >= 200 && res.status < 400,
      status: res.status,
      ms: performance.now() - start,
    };
  } catch {
    return { ok: false, status: 0, ms: performance.now() - start };
  }
}

async function runPath(path) {
  const url = `${BASE}${path}`;
  const times = [];
  let failed = 0;
  let completed = 0;
  const started = performance.now();

  async function worker() {
    while (completed < N) {
      const i = completed++;
      if (i >= N) return;
      const r = await fetchOne(url);
      times.push(r.ms);
      if (!r.ok) failed += 1;
    }
  }

  const workers = Array.from({ length: Math.min(C, N) }, () => worker());
  await Promise.all(workers);

  const totalMs = performance.now() - started;
  times.sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const pct = (p) => times[Math.min(times.length - 1, Math.floor((p / 100) * times.length))] ?? 0;

  console.log(`\n>>> ${path}`);
  console.log(`URL: ${url}`);
  console.log(`Concurrency Level:      ${C}`);
  console.log(`Time taken for tests:   ${(totalMs / 1000).toFixed(3)} seconds`);
  console.log(`Complete requests:      ${times.length}`);
  console.log(`Failed requests:        ${failed}`);
  console.log(`Requests per second:    ${(times.length / (totalMs / 1000)).toFixed(2)} [#/sec]`);
  console.log(`Time per request:       ${(sum / times.length).toFixed(3)} [ms] (mean)`);
  console.log(`Time per request:       ${(totalMs / times.length).toFixed(3)} [ms] (mean, across all concurrent)`);
  console.log(`Percentage of the requests served within a certain time (ms)`);
  for (const p of [50, 66, 75, 80, 90, 95, 98, 99, 100]) {
    console.log(`  ${String(p).padStart(3)}%  ${pct(p).toFixed(0)}`);
  }
}

console.log("========================================");
console.log(" Apache Bench–like (Node) — FactuPro");
console.log(` Target : ${BASE}`);
console.log(` -n ${N}  -c ${C}`);
console.log("========================================");

for (const path of PATHS) {
  await runPath(path);
}

console.log("\nTerminé. Regarde Failed requests (= 0) et Requests per second.");
