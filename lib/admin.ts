/**
 * Emails admin plateforme.
 * Côté client : NEXT_PUBLIC_PLATFORM_ADMIN_EMAILS
 * Côté serveur : PLATFORM_ADMIN_EMAILS (fallback sur NEXT_PUBLIC_)
 */
export function getAdminEmails(): string[] {
  const raw =
    (typeof window === "undefined"
      ? process.env.PLATFORM_ADMIN_EMAILS ||
        process.env.NEXT_PUBLIC_PLATFORM_ADMIN_EMAILS
      : process.env.NEXT_PUBLIC_PLATFORM_ADMIN_EMAILS) || "";

  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}
