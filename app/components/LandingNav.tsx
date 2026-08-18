"use client";

import { useUser } from "@clerk/nextjs";
import { LayersPlus } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function LandingNav() {
  const { user, isLoaded } = useUser();
  const appHref = "/invoices";

  return (
    <header className="sticky top-0 z-20 border-b border-base-300 bg-base-100/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center">
          <div className="rounded-full bg-info p-2 text-info-content">
            <LayersPlus className="h-5 w-5" />
          </div>
          <span className="ml-3 text-xl font-bold italic">
            Factu<span className="text-info">Pro</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <a href="#fonctionnalites" className="hover:text-info">
            Fonctionnalités
          </a>
          <a href="#comment-ca-marche" className="hover:text-info">
            Comment ça marche
          </a>
          <a href="#pour-qui" className="hover:text-info">
            Pour qui
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isLoaded && user ? (
            <Link href={appHref} className="btn btn-sm btn-info">
              Ouvrir l&apos;app
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="btn btn-sm btn-ghost">
                Connexion
              </Link>
              <Link href="/sign-up" className="btn btn-sm btn-info">
                Commencer
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
