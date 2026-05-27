"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils/classnames";

type HeaderActionsProps = {
  children: ReactNode;
  className?: string;
};

export function HeaderActions({ children, className }: HeaderActionsProps) {
  return <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>;
}

type HeaderActionLinkDirection = "back" | "forward" | "none";

type HeaderActionLinkProps = {
  href: string;
  children: ReactNode;
  direction?: HeaderActionLinkDirection;
  variant?: ButtonProps["variant"];
  className?: string;
};

export function HeaderActionLink({
  href,
  children,
  direction = "none",
  variant = "outline",
  className,
}: HeaderActionLinkProps) {
  const backIcon = <ArrowLeft className="h-4 w-4" />;
  const forwardIcon = <ArrowRight className="h-4 w-4" />;

  return (
    <Link className={className} href={href}>
      <Button type="button" variant={variant}>
        {direction === "back" ? (
          <>
            {backIcon}
            {children}
          </>
        ) : null}
        {direction === "none" ? children : null}
        {direction === "forward" ? (
          <>
            {children}
            {forwardIcon}
          </>
        ) : null}
      </Button>
    </Link>
  );
}

export function HeaderActionButton({ variant = "default", ...props }: ButtonProps) {
  return <Button variant={variant} {...props} />;
}
