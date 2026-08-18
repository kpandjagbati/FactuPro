import LandingNav from "@/app/components/LandingNav";
import UndrawIllustration from "@/app/components/UndrawIllustration";
import {
  FileText,
  Quote,
  Users,
  Wallet,
  Mail,
  Shield,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: FileText,
    title: "Factures & PDF",
    text: "Créez des factures numérotées, ajoutez vos lignes et exportez un PDF propre.",
  },
  {
    icon: Quote,
    title: "Devis convertibles",
    text: "Envoyez un devis, puis transformez-le en facture en un clic.",
  },
  {
    icon: Users,
    title: "Clients & entreprise",
    text: "IFU / NIF / RCCM, logo, coordonnées — pensé pour l’Afrique francophone.",
  },
  {
    icon: Wallet,
    title: "Suivi en XOF",
    text: "CA, impayés et factures en attente, visibles d’un coup d’œil.",
  },
  {
    icon: Mail,
    title: "Envoi par email",
    text: "Partagez facture ou devis directement depuis FactuPro.",
  },
  {
    icon: Shield,
    title: "Compte sécurisé",
    text: "Authentification Clerk, données isolées par organisation.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base-100">
      <LandingNav />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="badge badge-info badge-outline mb-4">Nouveau SaaS · V1</p>
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
            Facturez simplement,{" "}
            <span className="text-info">en français et en XOF</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg text-base-content/70">
            FactuPro aide les freelances et PME à créer des factures, devis et
            PDF professionnels — sans Excel, sans Word.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up" className="btn btn-info">
              Créer un compte gratuit
            </Link>
            <Link href="/sign-in" className="btn btn-ghost">
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
        <UndrawIllustration
          src="/illustrations/printing-invoices.svg"
          alt="Illustration unDraw : impression de factures"
        />
      </section>

      <section id="fonctionnalites" className="bg-base-200 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-3xl font-bold">Tout pour facturer</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-base-content/65">
            Une app claire, pensée pour les indépendants et petites entreprises.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl bg-base-100 p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-info/15 text-info">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-sm text-base-content/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2">
        <UndrawIllustration
          src="/illustrations/dashboard.svg"
          alt="Illustration unDraw : tableau de bord"
        />
        <div>
          <h2 className="text-3xl font-bold">Pilotez votre activité</h2>
          <p className="mt-3 text-base-content/70">
            Visualisez le CA encaissé, les factures en attente et les impayés.
            Gardez le contrôle sans tableur.
          </p>
        </div>
      </section>

      <section className="bg-base-200 py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">Devis, clients, paiements</h2>
            <p className="mt-3 text-base-content/70">
              Centralisez vos clients, convertissez un devis en facture, et
              suivez ce qui a été payé.
            </p>
          </div>
          <UndrawIllustration
            src="/illustrations/online-payments.svg"
            alt="Illustration unDraw : paiements en ligne"
          />
        </div>
      </section>

      <section id="comment-ca-marche" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold">En 3 étapes</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              n: "1",
              title: "Créez votre profil",
              text: "Nom, adresse, IFU/NIF/RCCM et logo de l’entreprise.",
            },
            {
              n: "2",
              title: "Ajoutez un client",
              text: "Puis rédigez un devis ou une facture avec vos lignes.",
            },
            {
              n: "3",
              title: "Envoyez le PDF",
              text: "Téléchargez ou envoyez par email, suivez le statut.",
            },
          ].map((step) => (
            <div key={step.n} className="rounded-xl bg-base-200 p-6">
              <div className="badge badge-info mb-3">{step.n}</div>
              <h3 className="font-bold">{step.title}</h3>
              <p className="mt-1 text-sm text-base-content/65">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pour-qui" className="bg-base-200 py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 md:grid-cols-2">
          <UndrawIllustration
            src="/illustrations/freelancer.svg"
            alt="Illustration unDraw : freelance au travail"
          />
          <div>
            <h2 className="text-3xl font-bold">Pour qui ?</h2>
            <p className="mt-3 text-base-content/70">
              Freelances, consultants, agences et PME d’Afrique francophone qui
              veulent un outil simple, en XOF, avec les mentions locales.
            </p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-base-content/70">
              <li>Indépendants qui facturent encore sur Word</li>
              <li>Petites structures qui veulent un suivi clair</li>
              <li>Équipes qui envoient devis puis facture</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold">Envoyez, relancez, encaissez</h2>
          <p className="mt-3 text-base-content/70">
            Un email prérempli, un PDF téléchargeable, un tableau de bord pour
            voir ce qui rentre. FactuPro est une V1 : on l’améliore avec vos
            retours.
          </p>
          <Link href="/sign-up" className="btn btn-info mt-6">
            Essayer FactuPro
          </Link>
        </div>
        <UndrawIllustration
          src="/illustrations/emails.svg"
          alt="Illustration unDraw : envoi d'emails"
        />
      </section>

      <section className="bg-info text-info-content">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">Prêt à facturer comme un pro ?</h2>
            <p className="mt-3 opacity-90">
              Inscription en quelques secondes. Gratuit pour démarrer.
            </p>
            <Link href="/sign-up" className="btn mt-6 bg-base-100 text-info">
              Créer mon compte
            </Link>
          </div>
          <UndrawIllustration
            src="/illustrations/growth-analytics.svg"
            alt="Illustration unDraw : croissance et analytics"
          />
        </div>
      </section>

      <footer className="border-t border-base-300 py-8 text-center text-sm text-base-content/55">
        <p>
          FactuPro · Illustrations{" "}
          <a
            href="https://undraw.co"
            className="link link-hover"
            target="_blank"
            rel="noreferrer"
          >
            unDraw
          </a>
        </p>
      </footer>
    </div>
  );
}
