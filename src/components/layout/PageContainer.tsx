import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** Whether to use max-width constraint (default: true) */
  constrained?: boolean;
}

/**
 * PageContainer provides consistent page-level padding and max-width constraints.
 *
 * Responsive padding:
 * - Mobile: px-4 py-4
 * - Tablet (sm): px-6 py-6
 * - Desktop (lg): px-8 py-6
 *
 * Max width: max-w-7xl (centered)
 */
export function PageContainer({ children, className, constrained = true }: PageContainerProps) {
  return (
    <div
      className={cn(
        "px-4 py-4 sm:px-6 sm:py-6 lg:px-8",
        constrained && "mx-auto max-w-7xl",
        className
      )}
    >
      {children}
    </div>
  );
}
