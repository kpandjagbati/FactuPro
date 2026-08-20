"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined,
) {
  const trimmed = name?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  }
  return (email?.slice(0, 2) ?? "?").toUpperCase();
}

export default function UserMenuButton() {
  const { user, isLoaded } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const [imgError, setImgError] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setImgError(false);
  }, [user?.imageUrl]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!isLoaded) {
    return <span className="loading loading-spinner loading-sm" />;
  }

  const email = user?.primaryEmailAddress?.emailAddress;
  const showPhoto = Boolean(user?.hasImage && user.imageUrl && !imgError);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn btn-ghost btn-circle h-9 min-h-9 w-9 p-0"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu compte"
        aria-expanded={open}
      >
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user!.imageUrl}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-info text-sm font-bold text-info-content">
            {getInitials(user?.fullName, email)}
          </span>
        )}
      </button>

      {open && (
        <ul className="menu absolute right-0 z-50 mt-2 w-52 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
          {user?.fullName ? (
            <li className="pointer-events-none px-3 py-1 text-sm font-semibold">
              {user.fullName}
            </li>
          ) : null}
          {email ? (
            <li className="pointer-events-none px-3 pb-2 text-xs opacity-60">
              {email}
            </li>
          ) : null}
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openUserProfile();
              }}
            >
              <User className="h-4 w-4" />
              Mon compte
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => signOut({ redirectUrl: "/" })}
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
