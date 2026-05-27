import { BackgroundJobNotifier } from "@/components/jobs/background-job-notifier";

type LocaleLayoutProps = {
  children: React.ReactNode;
};

export default function LocaleLayout({ children }: LocaleLayoutProps) {
  return (
    <>
      <BackgroundJobNotifier />
      {children}
    </>
  );
}
