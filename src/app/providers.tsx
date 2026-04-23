"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { AppToaster } from "@/components/app-toaster";
import { AuthSessionProvider } from "@/components/auth/auth-provider";
import { ApiError } from "@/lib/api/client";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 15_000,
            retry(failureCount, error) {
              if (error instanceof ApiError && error.status < 500) {
                return false;
              }

              return failureCount < 1;
            },
          },
        },
      }),
  );

  return (
    <AuthSessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <AppToaster />
      </QueryClientProvider>
    </AuthSessionProvider>
  );
}
