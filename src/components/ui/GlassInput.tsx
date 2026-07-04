import { forwardRef, type InputHTMLAttributes } from "react";

/**
 * GlassInput — Crystal OS input field.
 *
 * White-translucent background, soft border, blue focus ring.
 * Includes optional label and prefix/suffix icon slots.
 */

interface GlassInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  hint?: string;
  error?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  inputSize?: "sm" | "md" | "lg";
}

const inputSizeCls = {
  sm: "h-8 text-xs px-3",
  md: "h-10 text-sm px-4",
  lg: "h-12 text-sm px-4",
};

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      label,
      hint,
      error,
      prefixIcon,
      suffixIcon,
      inputSize = "md",
      className = "",
      id,
      ...rest
    },
    ref,
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-ink-muted"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {prefixIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">
              {prefixIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              // Base
              "w-full rounded-xl",
              "bg-white/55 backdrop-blur-md",
              "border",
              error
                ? "border-rose-400/50 focus:border-rose-400 focus:ring-rose-400/20"
                : "border-glass-border-strong focus:border-accent/50 focus:ring-accent/15",
              "text-ink placeholder:text-ink-subtle",
              "outline-none",
              "transition-all duration-150",
              "focus:ring-2 focus:bg-white/70",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              inputSizeCls[inputSize],
              prefixIcon ? "pl-9" : "",
              suffixIcon ? "pr-9" : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...rest}
          />

          {suffixIcon && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle">
              {suffixIcon}
            </span>
          )}
        </div>

        {(hint || error) && (
          <p className={`text-xs ${error ? "text-rose-500" : "text-ink-subtle"}`}>
            {error ?? hint}
          </p>
        )}
      </div>
    );
  },
);

GlassInput.displayName = "GlassInput";
