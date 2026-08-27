/**
 * FactuPro — smoke test k6 (léger)
 *
 * Usage:
 *   k6 run load-tests/k6/smoke.js
 *   k6 run -e BASE_URL=https://factu-pro-theta.vercel.app load-tests/k6/smoke.js
 *   k6 run -e BASE_URL=http://localhost:3000 load-tests/k6/smoke.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<3000"],
  },
};

const BASE_URL = (__ENV.BASE_URL || "https://factu-pro-theta.vercel.app").replace(
  /\/$/,
  "",
);

export default function () {
  const pages = ["/", "/sign-in", "/sign-up"];

  for (const path of pages) {
    const res = http.get(`${BASE_URL}${path}`, {
      tags: { name: path },
      redirects: 5,
    });

    check(res, {
      [`${path} status 200/302`]: (r) =>
        r.status === 200 || r.status === 302 || r.status === 307,
      [`${path} < 3s`]: (r) => r.timings.duration < 3000,
    });

    sleep(0.5);
  }
}
