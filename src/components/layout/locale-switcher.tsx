"use client";

import { Languages } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales, persistLocaleCookie, replaceLocaleInPathname, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/use-i18n";

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale, messages } = useI18n();

  function onSelect(nextLocale: Locale) {
    persistLocaleCookie(nextLocale);
    const search = searchParams.toString();
    const nextPath = `${replaceLocaleInPathname(pathname, nextLocale)}${search ? `?${search}` : ""}`;
    router.replace(nextPath);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <Languages className="h-4 w-4" />
          {messages.localeSwitcher[locale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{messages.localeSwitcher.label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map((candidate) => (
          <DropdownMenuItem key={candidate} onSelect={() => onSelect(candidate)}>
            {messages.localeSwitcher[candidate]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
