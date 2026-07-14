import { forwardRef, type HTMLAttributes } from "react";

/**
 * GlassPanel — Crystal OS base glass surface.
 *
 * The foundational element: white-translucent background, real backdrop-blur,
 * edge highlight on top, multi-layer depth shadow. Use as the base for
 * cards, modals, sidebars, and any floating panel.
 *
 * Variants:
 * - default: standard glass (55% opacity) for most panels
 * - soft: lighter (35%) for overlapping layers
 * - strong: near-solid (72%) for modals / important dialogs
 * - dark: canvas editor panels (stays dark regardless of page theme)
 */

type GlassPanelVariant = "default" | "soft" | "strong" | "dark";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassPanelVariant;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  noBorder?: boolean;
  noShadow?: boolean;
}

const variantStyles: Record<GlassPanelVariant, string> = {
  default: "crystal-panel",
  soft: "crystal-panel-soft",
  strong: "bg-glass-strong backdrop-blur-2xl border border-glass-border shadow-float",
  dark: "glass-dark",
};

const roundedStyles = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  full: "rounded-full",
};

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  (
    {
      variant = "default",
      rounded = "2xl",
      noBorder = false,
      noShadow = false,
      className = "",
      children,
      ...rest
    },
    ref,
  ) => {
    const base = variantStyles[variant];
    const rnd = roundedStyles[rounded];
    const overrides = [
      noBorder ? "border-0" : "",
      noShadow ? "shadow-none" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div ref={ref} className={`${base} ${rnd} ${overrides} ${className}`} {...rest}>
        {children}
      </div>
    );
  },
);

GlassPanel.displayName = "GlassPanel";
