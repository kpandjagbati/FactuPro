"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { LayersPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { checkAndAddUser } from "@/app/actions";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/", label: "Factures" },
  { href: "/quotes", label: "Devis" },
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
    <div className="border-b border-base-300 px-5 py-4 md:px-[10%]">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <div className="rounded-full bg-info p-2 text-info-content">
            <LayersPlus className="h-6 w-6" />
          </div>
          <span className="ml-3 text-2xl font-bold italic">
            Factu<span className="text-info">Pro</span>
          </span>
        </Link>

        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden items-center space-x-2 sm:flex">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`btn btn-sm ${isActiveLink(href) ? "btn-info" : "btn-ghost"}`}
              >
                {label}
              </Link>
            ))}
          </div>
          <UserButton />
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto sm:hidden">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`btn btn-sm ${isActiveLink(href) ? "btn-info" : "btn-ghost"}`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Navbar;
