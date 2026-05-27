"use client";

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createContext, useEffect, useState } from "react";

import { getCurrentUserProfile } from "@/lib/api/me";
import { clearRememberedDocumentJobs, persistSessionCookies } from "@/lib/supabase/session";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CurrentUserProfile } from "@/lib/types/api";

export type AuthSessionContextValue = {
  isLoading: boolean;
  isProfileLoading: boolean;
  session: Session | null;
  user: User | null;
  profile: CurrentUserProfile | null;
  role: CurrentUserProfile["role"];
  isAdmin: boolean;
  isLinguist: boolean;
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
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function applySession(nextSession: Session | null) {
      if (!mounted) {
        return;
      }

      persistSessionCookies(nextSession);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);

      if (!nextSession) {
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);
      try {
        const nextProfile = await getCurrentUserProfile();
        if (mounted) {
          setProfile(nextProfile);
        }
      } catch {
        if (mounted) {
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setIsProfileLoading(false);
        }
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      void applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) {
        clearRememberedDocumentJobs();
      }

      void applySession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const role = profile?.role ?? "linguist";

  return (
    <AuthSessionContext.Provider
      value={{
        isLoading,
        isProfileLoading,
        session,
        user,
        profile,
        role,
        isAdmin: role === "admin",
        isLinguist: role === "linguist",
        supabase,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}
