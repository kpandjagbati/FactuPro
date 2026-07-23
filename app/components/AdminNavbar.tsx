"use client";

import { UserButton } from "@clerk/nextjs";
import { LayersPlus, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/invoices", label: "Factures" },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname.replace(/\/$/, "") === href.replace(/\/$/, "");

  return (
    <div className="border-b border-base-300 bg-base-200/50 px-5 py-4 md:px-[10%]">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="flex items-center">
          <div className="rounded-full bg-neutral p-2 text-neutral-content">
            <Shield className="h-5 w-5" />
          </div>
          <span className="ml-3 text-xl font-bold italic">
            Factu<span className="text-info">Pro</span>
            <span className="ml-2 badge badge-neutral badge-sm">Admin</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden gap-2 sm:flex">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`btn btn-sm ${isActive(href) ? "btn-neutral" : "btn-ghost"}`}
              >
                {label}
              </Link>
            ))}
          </div>
          <UserButton />
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto sm:hidden">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`btn btn-sm ${isActive(href) ? "btn-neutral" : "btn-ghost"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <p className="mt-2 flex items-center gap-1 text-xs text-base-content/60">
        <LayersPlus className="h-3 w-3" />
        Espace plateforme — accès réservé
      </p>
    </div>
  );
}
