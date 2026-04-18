"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils/classnames";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/use-i18n";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => {
  const { messages } = useI18n();

  return <nav aria-label={messages.common.pagination} className={cn("mx-auto flex w-full justify-center", className)} {...props} />;
};
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentProps<typeof Button>;

const PaginationLink = ({ className, isActive, size = "icon", variant = isActive ? "default" : "ghost", ...props }: PaginationLinkProps) => (
  <Button className={cn(className)} size={size} variant={variant} {...props} />
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
  className,
  children,
  size = children ? "default" : "icon",
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  const { messages } = useI18n();

  return (
    <PaginationLink
      aria-label={messages.common.previous}
      className={cn(children ? "gap-1 px-3" : "", className)}
      size={size}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      {children}
    </PaginationLink>
  );
};
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  className,
  children,
  size = children ? "default" : "icon",
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  const { messages } = useI18n();

  return (
    <PaginationLink
      aria-label={messages.common.next}
      className={cn(children ? "gap-1 px-3" : "", className)}
      size={size}
      {...props}
    >
      {children}
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
};
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => {
  const { messages } = useI18n();

  return (
    <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">{messages.common.morePages}</span>
    </span>
  );
};
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
