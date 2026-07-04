"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

/**
 * GlassButton — Crystal OS interactive button.
 *
 * Variants:
 * - primary: solid ocean-blue fill + glow shadow (CTA)
 * - secondary: glass fill + blue border (secondary actions)
 * - ghost: transparent with hover glass effect (icon buttons)
 * - mint: fresh-mint fill (creative/AI actions)
 * - danger: rose fill (destructive actions)
 *
 * All variants include: liquid-press scale feedback, smooth transitions,
 * and focus ring for accessibility.
 */

type GlassButtonVariant = "primary" | "secondary" | "ghost" | "mint" | "danger";
type GlassButtonSize = "xs" | "sm" | "md" | "lg";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  pill?: boolean;
}

const variantCls: Record<GlassButtonVariant, string> = {
  primary: [
    "bg-gradient-to-r from-blue-600 to-blue-500",
    "text-white font-semibold",
    "border border-blue-400/30",
    "shadow-glow",
    "hover:from-blue-500 hover:to-blue-400 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]",
    "active:scale-[0.97]",
  ].join(" "),

  secondary: [
    "crystal-panel",
    "text-accent font-medium",
    "border border-accent/20",
    "hover:border-accent/40 hover:bg-white/70",
    "active:scale-[0.98]",
  ].join(" "),

  ghost: [
    "bg-transparent",
    "text-ink-muted",
    "border border-transparent",
    "hover:bg-white/60 hover:border-glass-border-strong hover:text-ink hover:shadow-card",
    "active:scale-[0.97]",
  ].join(" "),

  mint: [
    "bg-gradient-to-r from-teal-500 to-emerald-400",
    "text-white font-semibold",
    "border border-teal-400/30",
    "shadow-glow-mint",
    "hover:from-teal-400 hover:to-emerald-300",
    "active:scale-[0.97]",
  ].join(" "),

  danger: [
    "bg-gradient-to-r from-rose-500 to-rose-400",
    "text-white font-semibold",
    "border border-rose-400/30",
    "hover:from-rose-400 hover:to-rose-300",
    "active:scale-[0.97]",
  ].join(" "),
};

const sizeCls: Record<GlassButtonSize, string> = {
  xs: "h-7 px-3 text-xs gap-1.5",
  sm: "h-8 px-3.5 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2.5",
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      icon,
      iconRight,
      loading = false,
      pill = false,
      disabled,
      className = "",
      children,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          "inline-flex items-center justify-center",
          "transition-all duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
          pill ? "rounded-full" : "rounded-xl",
          variantCls[variant],
          sizeCls[size],
          isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {loading ? (
          <LoadingSpinner size={size} />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  },
);

GlassButton.displayName = "GlassButton";

function LoadingSpinner({ size }: { size: GlassButtonSize }) {
  const sz = size === "xs" || size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <svg
      className={`${sz} animate-spin`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32"
        strokeDashoffset="12"
      />
    </svg>
  );
}
