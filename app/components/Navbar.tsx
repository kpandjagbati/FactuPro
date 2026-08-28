"use client";

import { useUser } from "@clerk/nextjs";
import { LayersPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { checkAndAddUser } from "@/app/actions";
import ThemeToggle from "./ThemeToggle";
import UserMenuButton from "./UserMenuButton";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invoices", label: "Factures" },
  { href: "/quotes", label: "Devis" },
  { href: "/recurring", label: "Abonnements" },
  { href: "/credit-notes", label: "Avoirs" },
  { href: "/expenses", label: "Dépenses" },
  { href: "/reports", label: "Rapports" },
  { href: "/products", label: "Articles" },
  { href: "/clients", label: "Clients" },
  { href: "/entreprise", label: "Entreprise" },
];

const Navbar = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (syncedRef.current) return;
    if (user?.primaryEmailAddress?.emailAddress && user.fullName) {
      syncedRef.current = true;
      void checkAndAddUser(
        user.id,
        user.primaryEmailAddress.emailAddress,
        user.fullName,
      );
    }
  }, [user]);

  const isActiveLink = (href: string) =>
    pathname.replace(/\/$/, "") === href.replace(/\/$/, "");

  return (
    <div className="border-b border-base-300 px-4 py-3.5 md:px-[6%]">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center shrink-0 mr-4">
          <div className="rounded-full bg-info p-2 text-info-content">
            <LayersPlus className="h-5 w-5" />
          </div>
          <span className="ml-2.5 text-xl font-bold italic">
            Factu<span className="text-info">Pro</span>
          </span>
        </Link>

        {/* Desktop navbar */}
        <div className="hidden xl:flex items-center space-x-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`btn btn-xs sm:btn-sm ${
                isActiveLink(href) ? "btn-info" : "btn-ghost"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <UserMenuButton />
        </div>
      </div>

      {/* Mobile & Tablet horizontal scroll menu */}
      <div className="mt-2.5 flex gap-1.5 overflow-x-auto xl:hidden pb-1 scrollbar-none">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`btn btn-xs shrink-0 ${
              isActiveLink(href) ? "btn-info" : "btn-ghost"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Navbar;
