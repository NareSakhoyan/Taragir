"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/lib/i18n/use-i18n";
import { toast } from "@/lib/notifications";

type AcceptedStartOptions = {
  title: string;
  description?: string | null;
  path?: string | null;
  redirect?: boolean;
  actionLabel?: string | null;
  onAccepted?: () => void;
};

export function useStartAndRedirect() {
  const router = useRouter();
  const { href, messages } = useI18n();

  function handleAcceptedStart({
    title,
    description,
    path,
    redirect = true,
    actionLabel,
    onAccepted,
  }: AcceptedStartOptions) {
    const localizedPath = path ? href(path) : null;

    toast.success(
      title,
      description || (!redirect && localizedPath)
        ? {
            description: description ?? undefined,
            action:
              !redirect && localizedPath
                ? {
                    label: actionLabel ?? messages.job.openJob,
                    onClick: () => router.push(localizedPath),
                  }
                : undefined,
          }
        : undefined,
    );
    onAccepted?.();

    if (!redirect || !localizedPath) {
      return;
    }

    startTransition(() => {
      router.push(localizedPath);
    });
  }

  function handleStartError(title: string, error: unknown) {
    toast.error(title, {
      description: error instanceof Error ? error.message : undefined,
    });
  }

  return {
    handleAcceptedStart,
    handleStartError,
  };
}
