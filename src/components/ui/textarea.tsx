import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * A customized textarea component that provides more vertical space
 * and larger padding than the default implementation.  These
 * changes make multiline fields feel less cramped and improve
 * readability when entering longer notes or descriptions.  The
 * default text size has been raised from `text-sm` to `text-base` for
 * consistency with other inputs.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Increase the minimum height from 80px to 120px and
        // adjust padding/text sizing.  Removing explicit text-sm
        // results in a base font size applied uniformly.
        "flex min-h-[120px] w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };