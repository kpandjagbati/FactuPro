# Tests de charge FactuPro

Outils : **Apache Bench (`ab`)** et **k6**.

Cibles testées (routes publiques, sans login Clerk) :
- `/` — landing
- `/sign-in`
- `/sign-up`

> Les pages `/dashboard`, `/invoices`, `/admin` nécessitent une session Clerk : elles ne sont pas dans ces scripts de base.

## Prérequis

- **k6** : `winget install GrafanaLabs.k6` (déjà installé si tu as suivi le setup)
- **Apache Bench** :
  - idéal : Docker Desktop démarré (`httpd` fournit `ab`)
  - sinon : fallback Node inclus (`run-ab-node.mjs`)

## Lancer k6

```bash
# Smoke (5 users, 30s) — prod
npm run load:k6:smoke

# Smoke — local (npm run dev doit tourner)
k6 run -e BASE_URL=http://localhost:3000 load-tests/k6/smoke.js

# Charge plus forte (~25 users)
npm run load:k6:load
```

## Lancer Apache Bench

> **Attention :** `ab` parle en **HTTP/1.0**. Vercel (prod HTTPS) répond souvent **403**.  
> Utilise `ab` sur **localhost**, et **k6** pour la prod.

```bash
# 1) démarre l'app
npm run dev

# 2) dans un autre terminal — vrai Apache Bench via Docker
bash load-tests/ab/run-ab.sh http://localhost:3000

# Ou fallback Node (fonctionne aussi en HTTPS prod)
npm run load:ab:node
```

```bash
# Prod HTTPS → préfère k6
npm run load:k6:smoke
```

## Lire les résultats

| Indicateur | Bon signe |
|------------|-----------|
| Failed requests / `http_req_failed` | ~0 % |
| Requests/sec (ab) | stable, sans crash |
| p(95) durée (k6) | < 3–5 s sur Vercel Hobby |

Sur le plan **Hobby Vercel**, un test trop agressif peut déclencher du rate-limiting — commence par le smoke.

## Résultat smoke k6 (exemple prod)

Déjà exécuté avec succès :
- 180 requêtes, **0 % d’échec**
- p(95) ≈ **1.37 s** (seuil < 3 s OK)
