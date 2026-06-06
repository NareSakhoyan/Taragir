"use client";

import type { AuthChangeEvent, Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createContext, useEffect, useRef, useState } from "react";

import { getCurrentUserProfile } from "@/lib/api/me";
import { clearRememberedDocumentJobs, persistSessionCookies } from "@/lib/supabase/session";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CurrentUserProfile } from "@/lib/types/api";
import { VIEW_MODE_STORAGE_KEY } from "@/lib/utils/constants";

export type ViewMode = "admin" | "normal";

export type AuthSessionContextValue = {
  isLoading: boolean;
  isProfileLoading: boolean;
  session: Session | null;
  user: User | null;
  profile: CurrentUserProfile | null;
  accountRole: CurrentUserProfile["role"];
  role: CurrentUserProfile["role"];
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
  isAccountAdmin: boolean;
  isAdmin: boolean;
  isLinguist: boolean;
  supabase: SupabaseClient;
};

export const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

type AuthSessionProviderProps = {
  children: React.ReactNode;
};

const supabase = getSupabaseBrowserClient();
const profileCache = new Map<string, CurrentUserProfile>();
const profileRequests = new Map<string, Promise<CurrentUserProfile>>();

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window === "undefined") {
      return "admin";
    }

    const storedViewMode = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return storedViewMode === "admin" || storedViewMode === "normal" ? storedViewMode : "admin";
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const profileUserIdRef = useRef<string | null>(null);

  function setViewMode(nextViewMode: ViewMode) {
    setViewModeState(nextViewMode);
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, nextViewMode);
  }

  useEffect(() => {
    let mounted = true;

    async function fetchProfileForUser(userId: string) {
      const cachedProfile = profileCache.get(userId);
      if (cachedProfile) {
        return cachedProfile;
      }

      const existingRequest = profileRequests.get(userId);
      if (existingRequest) {
        return existingRequest;
      }

      const request = getCurrentUserProfile().then((nextProfile) => {
        profileCache.set(nextProfile.id, nextProfile);
        return nextProfile;
      });
      profileRequests.set(userId, request);

      try {
        return await request;
      } finally {
        profileRequests.delete(userId);
      }
    }

    async function loadProfile(userId: string) {
      const cachedProfile = profileCache.get(userId);
      if (cachedProfile) {
        if (mounted) {
          setProfile(cachedProfile);
          profileUserIdRef.current = cachedProfile.id;
        }
        return;
      }

      setIsProfileLoading(true);
      try {
        const nextProfile = await fetchProfileForUser(userId);
        if (mounted) {
          setProfile(nextProfile);
          profileUserIdRef.current = nextProfile.id;
        }
      } catch {
        if (mounted) {
          setProfile(null);
          profileUserIdRef.current = null;
        }
      } finally {
        if (mounted) {
          setIsProfileLoading(false);
        }
      }
    }

    async function applySession(nextSession: Session | null, event: AuthChangeEvent | "INITIAL") {
      if (!mounted) {
        return;
      }

      persistSessionCookies(nextSession);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);

      if (!nextSession) {
        setProfile(null);
        profileUserIdRef.current = null;
        setIsProfileLoading(false);
        setViewModeState("normal");
        return;
      }

      const nextUserId = nextSession.user.id;
      const profileAlreadyLoaded = profileUserIdRef.current === nextUserId;

      const isInitialAuthEvent = event === "INITIAL" || event === "INITIAL_SESSION";

      if (event === "TOKEN_REFRESHED" && profileAlreadyLoaded) {
        return;
      }

      if (profileAlreadyLoaded && !isInitialAuthEvent && event !== "SIGNED_IN") {
        return;
      }

      await loadProfile(nextUserId);
    }

    let initialSessionHandled = false;

    supabase.auth.getSession().then(({ data }) => {
      initialSessionHandled = true;
      void applySession(data.session, "INITIAL");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!nextSession) {
        clearRememberedDocumentJobs();
      }

      if (event === "INITIAL_SESSION" && initialSessionHandled) {
        persistSessionCookies(nextSession);
        setSession(nextSession);
        setUser(nextSession.user);
        setIsLoading(false);
        return;
      }

      void applySession(nextSession, event);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const accountRole = profile?.role ?? "linguist";
  const isAccountAdmin = accountRole === "admin";
  const role = isAccountAdmin && viewMode === "admin" ? "admin" : "linguist";

  return (
    <AuthSessionContext.Provider
      value={{
        isLoading,
        isProfileLoading,
        session,
        user,
        profile,
        accountRole,
        role,
        viewMode: isAccountAdmin ? viewMode : "normal",
        setViewMode,
        isAccountAdmin,
        isAdmin: role === "admin",
        isLinguist: role === "linguist",
        supabase,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}
