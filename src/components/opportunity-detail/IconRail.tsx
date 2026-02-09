import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

export interface IconRailItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  badge?: number | string;
  badgeVariant?: "default" | "destructive";
}

interface IconRailProps {
  items: IconRailItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export const IconRail = ({ items, activeId, onSelect }: IconRailProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex items-center justify-around border-t border-border bg-card/80 backdrop-blur-sm px-1 py-1.5 flex-shrink-0">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all duration-200 relative min-w-0",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span
                    className={cn(
                      "absolute -top-1.5 -right-2 text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-0.5",
                      item.badgeVariant === "destructive"
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium leading-tight truncate max-w-[48px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Desktop: vertical icon rail
  return (
    <div className="flex flex-col items-center gap-1 py-3 px-1.5 border-r border-border bg-muted/30 flex-shrink-0 w-14">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelect(item.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 w-10 py-2 rounded-lg transition-all duration-200 relative",
                  isActive
                    ? "text-primary bg-primary/10 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge && (
                    <span
                      className={cn(
                        "absolute -top-1.5 -right-2.5 text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-0.5",
                        item.badgeVariant === "destructive"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium leading-tight">
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};
