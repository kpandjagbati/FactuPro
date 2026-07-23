# FactuPro

SaaS de gestion de factures — Next.js, PostgreSQL, Clerk, DaisyUI (Fantasy).

## V1 + V2

- Auth Clerk
- Profil entreprise + **logo**
- Carnet clients
- Factures (CRUD, lignes, TVA, PDF, **email**, filtres)
- **Devis** → conversion en facture
- **Dashboard** (CA, impayées, top clients)
- Devise XOF, isolation par organisation

## Démarrage

```bash
npx prisma db push
npm run dev
```

### Email (Resend)

1. Crée un compte sur [resend.com](https://resend.com)
2. Ajoute dans `.env.local` :

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="FactuPro <onboarding@resend.dev>"
```

Sans cette clé, le bouton **Email** affiche un message d'erreur explicite.

## Parcours

1. **Entreprise** → profil + logo  
2. **Clients** → carnet  
3. **Devis** → créer → convertir en facture  
4. **Factures** → éditer → PDF / Email  
5. **Dashboard** → vue d'ensemble  
