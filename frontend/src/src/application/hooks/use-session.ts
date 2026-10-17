"use client";

import { useEffect, useState } from "react";
import type { Session } from "@/src/domain/entities/user";
import { repositories } from "../services/container";

export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    repositories.auth.currentSession().then((result) => {
      if (!cancelled) {
        setSession(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { session, loading };
}
