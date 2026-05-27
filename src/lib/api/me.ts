"use client";

import { apiFetch } from "@/lib/api/client";
import type { CurrentUserProfile } from "@/lib/types/api";

export async function getCurrentUserProfile() {
  return apiFetch<CurrentUserProfile>("/api/v1/me/profile", {
    skipUnauthorizedRedirect: true,
  });
}
