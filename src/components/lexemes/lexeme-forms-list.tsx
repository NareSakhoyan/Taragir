"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/use-i18n";

type LexemeFormsListProps = {
  normalizedForms: string[];
};

export function LexemeFormsList({ normalizedForms }: LexemeFormsListProps) {
  const { messages } = useI18n();

  return (
    <section className="rounded-md border border-border/80 bg-card/70 p-5 shadow-sm">
      <div className="border-b border-border/70 pb-4">
        <h3 className="font-semibold tracking-tight">{messages.lexemeDetail.normalizedFormsTitle}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{messages.lexemeDetail.normalizedFormsDescription}</p>
      </div>

      <div className="pt-5">
        {normalizedForms.length ? (
          <div className="flex flex-wrap gap-2">
            {normalizedForms.map((form) => (
              <Badge className="px-3 py-1" key={form} variant="outline">
                {form}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border/80 bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
            {messages.lexemeDetail.noNormalizedForms}
          </div>
        )}
      </div>
    </section>
  );
}
