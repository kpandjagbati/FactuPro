/**
 * FactuPro — test de charge k6
 *
 * Usage:
 *   k6 run load-tests/k6/load.js
 *   k6 run -e BASE_URL=https://factu-pro-theta.vercel.app load-tests/k6/load.js
 */
import http from "k6/http";
import { check, group, sleep } from "k6";

export const options = {
  stages: [
    { duration: "20s", target: 10 },
    { duration: "40s", target: 25 },
    { duration: "20s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.10"],
    http_req_duration: ["p(95)<5000"],
  },
};

const BASE_URL = (__ENV.BASE_URL || "https://factu-pro-theta.vercel.app").replace(
  /\/$/,
  "",
);

export default function () {
  group("landing", () => {
    const res = http.get(`${BASE_URL}/`, {
      tags: { name: "GET /" },
      redirects: 5,
    });
    check(res, {
      "landing ok": (r) => r.status === 200,
    });
  });

  sleep(1);

  group("auth pages", () => {
    const signIn = http.get(`${BASE_URL}/sign-in`, {
      tags: { name: "GET /sign-in" },
      redirects: 5,
    });
    check(signIn, {
      "sign-in reachable": (r) =>
        r.status === 200 || r.status === 302 || r.status === 307,
    });

    const signUp = http.get(`${BASE_URL}/sign-up`, {
      tags: { name: "GET /sign-up" },
      redirects: 5,
    });
    check(signUp, {
      "sign-up reachable": (r) =>
        r.status === 200 || r.status === 302 || r.status === 307,
    });
  });

  sleep(1);
}
