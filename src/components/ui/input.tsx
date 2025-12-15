import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A shared Input component used throughout the MerchantFlow UI.  The
 * default styling has been adjusted from the upstream version to
 * increase the height and padding of form fields, making them easier
 * to interact with on both desktop and mobile devices.  In addition
 * to the larger hit area, the responsive text size fallback has been
 * removed so that inputs consistently render with a base font size
 * across all breakpoints.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Increase height from h-10 (2.5rem) to h-12 (3rem) and
          // enlarge padding for better usability.  Removing md:text-sm
          // ensures a consistent text size across breakpoints.
          "flex h-12 w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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