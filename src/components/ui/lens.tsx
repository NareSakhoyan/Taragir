"use client";

import * as React from "react";

import { cn } from "@/lib/utils/classnames";

type Position = {
  x: number;
  y: number;
};

type LensProps = {
  children: React.ReactNode;
  zoomFactor?: number;
  lensSize?: number;
  position?: Position;
  defaultPosition?: Position;
  isStatic?: boolean;
  duration?: number;
  lensColor?: string;
  ariaLabel?: string;
  className?: string;
};

export function Lens({
  children,
  zoomFactor = 1.3,
  lensSize = 170,
  position,
  defaultPosition,
  isStatic = false,
  duration = 0.1,
  lensColor,
  ariaLabel = "Zoom area",
  className,
}: LensProps) {
  const [internalPosition, setInternalPosition] = React.useState<Position | null>(defaultPosition ?? null);
  const [isHovering, setIsHovering] = React.useState(false);
  const [contentSize, setContentSize] = React.useState({ height: 0, width: 0 });
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const currentPosition = position ?? internalPosition;
  const shouldShowLens = Boolean(
    currentPosition &&
      contentSize.width > 0 &&
      contentSize.height > 0 &&
      (isStatic || isHovering || defaultPosition),
  );

  React.useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return;
      }

      const { height, width } = entry.contentRect;
      setContentSize({ height, width });
    });

    observer.observe(content);

    return () => observer.disconnect();
  }, []);

  function updatePosition(event: React.PointerEvent<HTMLDivElement>) {
    if (isStatic || position) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    setInternalPosition({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
  }

  return (
    <div
      aria-label={ariaLabel}
      className={cn("relative inline-block overflow-visible", className)}
      onPointerEnter={(event) => {
        setIsHovering(true);
        updatePosition(event);
      }}
      onPointerLeave={() => setIsHovering(false)}
      onPointerMove={updatePosition}
      role="img"
    >
      <div ref={contentRef}>{children}</div>
      {shouldShowLens && currentPosition ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 overflow-hidden rounded-full border border-white/70 shadow-2xl ring-1 ring-black/20"
          style={{
            backgroundColor: lensColor ?? "hsl(var(--background))",
            height: lensSize,
            left: currentPosition.x - lensSize / 2,
            top: currentPosition.y - lensSize / 2,
            transition: `left ${duration}s ease-out, top ${duration}s ease-out`,
            width: lensSize,
          }}
        >
          <div
            className="absolute left-0 top-0"
            style={{
              height: contentSize.height,
              transform: `translate(${lensSize / 2 - currentPosition.x * zoomFactor}px, ${
                lensSize / 2 - currentPosition.y * zoomFactor
              }px) scale(${zoomFactor})`,
              transformOrigin: "top left",
              transition: `transform ${duration}s ease-out`,
              width: contentSize.width,
            }}
          >
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}
