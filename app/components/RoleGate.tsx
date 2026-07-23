"use client";

import { isPlatformAdminEmail } from "@/lib/admin";
import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Sépare les parcours :
 * - admin  → uniquement /admin
 * - user   → uniquement l'app (pas /admin)
 */
export default function RoleGate({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const email = user.primaryEmailAddress?.emailAddress;
    const isAdmin = isPlatformAdminEmail(email);
    const onAdmin = pathname.startsWith("/admin");
    const onAuth =
      pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

    if (onAuth) return;

    if (isAdmin && !onAdmin) {
      router.replace("/admin");
      return;
    }

    if (!isAdmin && onAdmin) {
      router.replace("/");
    }
  }, [isLoaded, user, pathname, router]);

  return <>{children}</>;
}
