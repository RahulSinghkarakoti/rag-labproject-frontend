// components/AuthSessionHandler.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef } from "react";

const AUTH_ERRORS = new Set([
  "RefreshAccessTokenError",
  "NoRefreshToken",
  "OAuthFailed",
  "OAuthExchangeError",
  "InvalidTokenPayload",
]);

export default function AuthSessionHandler({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const signingOut = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" && status !== "unauthenticated") return;

    const error = (session as { error?: string } | null)?.error;
    if (!error || !AUTH_ERRORS.has(error) || signingOut.current) return;

    signingOut.current = true;
    void signOut({ callbackUrl: "/login" });
  }, [session, status]);

  return <>{children}</>;
}
