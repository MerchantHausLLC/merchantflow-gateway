import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Merchant Haus "Underline" Input
 *
 * Architectural style: no boxed inputs. Uses a bottom border that
 * transitions from canvas-border to haus-charcoal on focus. The
 * label is handled externally via the Label component with the
 * `label-caps` utility class for uppercase tracking.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full bg-transparent border-0 border-b-2 border-haus-canvas px-0 py-2 text-sm font-light text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
