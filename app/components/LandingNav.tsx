"use client";

import { useUser } from "@clerk/nextjs";
import { LayersPlus, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#pour-qui", label: "Pour qui" },
];

export default function LandingNav() {
  const { user, isLoaded } = useUser();
  const appHref = "/invoices";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-5 sm:py-4">
          <Link href="/" className="flex min-w-0 items-center">
            <div className="shrink-0 rounded-full bg-info p-2 text-info-content">
              <LayersPlus className="h-5 w-5" />
            </div>
            <span className="ml-2 truncate text-lg font-bold italic sm:ml-3 sm:text-xl">
              Factu<span className="text-info">Pro</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
            {navLinks.map(({ href, label }) => (
              <a key={href} href={href} className="hover:text-info">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {isLoaded && user ? (
              <Link href={appHref} className="btn btn-sm btn-info">
                App
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="btn btn-ghost btn-sm hidden sm:inline-flex"
                >
                  Connexion
                </Link>
                <Link href="/sign-up" className="btn btn-sm btn-info">
                  <span className="hidden sm:inline">Commencer</span>
                  <span className="sm:hidden">Démarrer</span>
                </Link>
              </>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square lg:hidden"
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-base-300/50 lg:hidden"
          aria-hidden
          onClick={closeMenu}
        />
      ) : null}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(100vw,20rem)] flex-col border-l border-base-300 bg-base-100 p-5 shadow-xl transition-transform duration-200 lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="font-bold">Menu</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square"
            onClick={closeMenu}
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-lg px-3 py-3 text-base font-medium hover:bg-base-200"
              onClick={closeMenu}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="mt-auto space-y-2 border-t border-base-300 pt-4">
          {isLoaded && user ? (
            <Link
              href={appHref}
              className="btn btn-info btn-block"
              onClick={closeMenu}
            >
              Ouvrir l&apos;app
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="btn btn-ghost btn-block"
                onClick={closeMenu}
              >
                Connexion
              </Link>
              <Link
                href="/sign-up"
                className="btn btn-info btn-block"
                onClick={closeMenu}
              >
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
