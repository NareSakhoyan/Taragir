"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useTrackedJobs } from "@/lib/hooks/use-job";
import { useI18n } from "@/lib/i18n/use-i18n";
import { toast } from "@/lib/notifications";
import {
  forgetActiveJob,
  getRememberedActiveJobIds,
} from "@/lib/supabase/session";
import { resolveJobResultAction, resolveJobStageMessage, formatJobKind } from "@/lib/utils/jobs";
import { JOB_TRACKER_EVENT, ROUTES } from "@/lib/utils/constants";

export function BackgroundJobNotifier() {
  const router = useRouter();
  const { href, messages } = useI18n();
  const [trackedJobIds, setTrackedJobIds] = useState<string[]>(() => getRememberedActiveJobIds());
  const trackedJobQueries = useTrackedJobs(trackedJobIds);
  const seenStatusesRef = useRef<Map<string, string>>(new Map());
  const hasPrimedRef = useRef(false);
  const jobs = trackedJobQueries
    .map((query) => query.data)
    .filter((job): job is NonNullable<typeof job> => Boolean(job));

  useEffect(() => {
    function syncTrackedJobs() {
      setTrackedJobIds(getRememberedActiveJobIds());
    }

    syncTrackedJobs();
    window.addEventListener(JOB_TRACKER_EVENT, syncTrackedJobs as EventListener);

    return () => {
      window.removeEventListener(JOB_TRACKER_EVENT, syncTrackedJobs as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!trackedJobIds.length && !jobs.length) {
      seenStatusesRef.current = new Map();
      hasPrimedRef.current = false;
      return;
    }

    const nextSeenStatuses = new Map<string, string>();

    for (const job of jobs) {
      nextSeenStatuses.set(job.id, job.status);
    }

    if (!hasPrimedRef.current) {
      seenStatusesRef.current = nextSeenStatuses;
      hasPrimedRef.current = true;
      return;
    }

    for (const job of jobs) {
      const previousStatus = seenStatusesRef.current.get(job.id);

      if (!previousStatus || previousStatus === job.status) {
        continue;
      }

      const jobKind = formatJobKind(job.job_kind, messages.job);
      const description = resolveJobStageMessage(job, messages);
      const completedAction = resolveJobResultAction(job, messages.job);
      const fallbackAction = {
        href: `${ROUTES.jobs}/${job.id}`,
        label: messages.job.openJob,
      };
      const action = completedAction ?? fallbackAction;

      if (job.status === "completed") {
        forgetActiveJob(job.id);
        toast.success(
          messages.job.notifications.completedTitle.replace("{jobKind}", jobKind),
          {
            description,
            action: {
              label: action.label,
              onClick: () => router.push(href(action.href)),
            },
          },
        );
      }

      if (job.status === "failed") {
        forgetActiveJob(job.id);
        toast.error(
          messages.job.notifications.failedTitle.replace("{jobKind}", jobKind),
          {
            description,
            action: {
              label: fallbackAction.label,
              onClick: () => router.push(href(fallbackAction.href)),
            },
          },
        );
      }
    }

    seenStatusesRef.current = nextSeenStatuses;
  }, [href, jobs, messages, router, trackedJobIds.length]);

  return null;
}
