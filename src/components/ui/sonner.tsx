"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border group-[.toaster]:border-foreground/30 group-[.toaster]:bg-card/95 group-[.toaster]:text-foreground group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur dark:group-[.toaster]:border-foreground/35",
          title: "group-[.toast]:font-semibold group-[.toast]:text-foreground",
          description: "group-[.toast]:text-foreground/85",
          success:
            "group-[.toaster]:border-emerald-900/35 group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-950 dark:group-[.toaster]:border-emerald-300/45 dark:group-[.toaster]:bg-emerald-950/30 dark:group-[.toaster]:text-emerald-100",
          error:
            "group-[.toaster]:border-red-950/35 group-[.toaster]:bg-red-50 group-[.toaster]:text-red-950 dark:group-[.toaster]:border-red-300/45 dark:group-[.toaster]:bg-red-950/30 dark:group-[.toaster]:text-red-100",
          warning:
            "group-[.toaster]:border-amber-950/35 group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-950 dark:group-[.toaster]:border-amber-300/45 dark:group-[.toaster]:bg-amber-950/30 dark:group-[.toaster]:text-amber-100",
          info:
            "group-[.toaster]:border-sky-950/35 group-[.toaster]:bg-sky-50 group-[.toaster]:text-sky-950 dark:group-[.toaster]:border-sky-300/45 dark:group-[.toaster]:bg-sky-950/30 dark:group-[.toaster]:text-sky-100",
          icon: "group-[.toast]:text-current",
          closeButton:
            "group-[.toast]:border-transparent group-[.toast]:bg-transparent group-[.toast]:text-foreground/40 hover:group-[.toast]:bg-background/50 hover:group-[.toast]:text-foreground/65",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground hover:group-[.toast]:bg-primary/90",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground hover:group-[.toast]:text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
