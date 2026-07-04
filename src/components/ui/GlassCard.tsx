"use client";

import { forwardRef, type HTMLAttributes } from "react";

/**
 * GlassCard — Interactive Crystal OS card.
 *
 * Extends GlassPanel with hover lift animation, glass-sheen reflection,
 * and optional blue accent border on hover. Use for project cards,
 * studio type cards, template cards, and any clickable surface.
 */

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Show accent (blue) border glow on hover */
  accentHover?: boolean;
  /** Static float animation when not interacted with */
  floatAnim?: boolean;
  /** Disable hover lift */
  noHover?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      accentHover = false,
      floatAnim = false,
      noHover = false,
      className = "",
      children,
      ...rest
    },
    ref,
  ) => {
    const hoverCls = noHover
      ? ""
      : "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[3px] hover:shadow-card-hover";

    const accentCls = accentHover
      ? "hover:border-accent/25"
      : "";

    const floatCls = floatAnim ? "animate-hover-float" : "";

    return (
      <div
        ref={ref}
        className={[
          // Base glass
          "crystal-panel glass-sheen",
          "rounded-2xl",
          // Interactive
          hoverCls,
          accentCls,
          floatCls,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

GlassCard.displayName = "GlassCard";
