import { notFound } from "next/navigation";

import { BackgroundJobNotifier } from "@/components/jobs/background-job-notifier";
import { isLocale } from "@/lib/i18n/config";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <>
      <BackgroundJobNotifier />
      {children}
    </>
  );
}
