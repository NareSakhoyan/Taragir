"use client";

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createContext, useEffect, useState } from "react";

import { clearRememberedDocumentJobs, persistSessionCookies } from "@/lib/supabase/session";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type AuthSessionContextValue = {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  supabase: SupabaseClient;
};

export const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

type AuthSessionProviderProps = {
  children: React.ReactNode;
};

const supabase = getSupabaseBrowserClient();

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      persistSessionCookies(data.session);
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      persistSessionCookies(nextSession);

      if (!nextSession) {
        clearRememberedDocumentJobs();
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthSessionContext.Provider
      value={{
        isLoading,
        session,
        user,
        supabase,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}
