import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Section provides consistent vertical spacing between content blocks.
 *
 * Features:
 * - Standard vertical spacing (space-y-6)
 * - Optional section title with consistent sizing
 * - Optional description
 */
export function Section({ children, title, description, className }: SectionProps) {
  return (
    <section className={cn("space-y-6", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
