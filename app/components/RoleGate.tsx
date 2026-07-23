"use client";

import { isPlatformAdminEmail } from "@/lib/admin";
import { useUser } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Sépare les parcours :
 * - admin  → uniquement /admin
 * - user   → uniquement l'app (pas /admin)
 */
export default function RoleGate({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const onAuth =
      pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

    if (!user || onAuth) {
      setReady(true);
      return;
    }

    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress;

    const isAdmin = isPlatformAdminEmail(email);
    const onAdmin = pathname.startsWith("/admin");

    if (isAdmin && !onAdmin) {
      router.replace("/admin");
      return;
    }

    if (!isAdmin && onAdmin) {
      router.replace("/");
      return;
    }

    setReady(true);
  }, [isLoaded, user, pathname, router]);

  if (!isLoaded || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg text-info" />
      </div>
    );
  }

  return <>{children}</>;
}
