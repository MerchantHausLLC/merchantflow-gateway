import { useState } from "react";
import { Phone, PhoneCall, PhoneOff, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClickToCallProps {
  phoneNumber: string | null | undefined;
  contactName?: string;
  size?: "sm" | "default" | "icon";
  variant?: "default" | "ghost" | "outline";
  className?: string;
  showLabel?: boolean;
}

export const ClickToCall = ({
  phoneNumber,
  contactName,
  size = "icon",
  variant = "ghost",
  className,
  showLabel = false,
}: ClickToCallProps) => {
  const [calling, setCalling] = useState(false);

  if (!phoneNumber) return null;

  const handleCall = () => {
    setCalling(true);
    
    // Open Quo/OpenPhone with tel: protocol which Quo intercepts
    // Quo desktop/mobile app registers as handler for tel: URIs
    window.open(`tel:${phoneNumber}`, '_self');
    
    toast.success(
      `Initiating call to ${contactName || phoneNumber}`,
      { description: "Opening in your Quo dialler..." }
    );

    setTimeout(() => setCalling(false), 2000);
  };

  if (showLabel) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn("gap-2", className)}
        onClick={handleCall}
        disabled={calling}
      >
        {calling ? (
          <PhoneCall className="h-4 w-4 animate-pulse text-green-500" />
        ) : (
          <Phone className="h-4 w-4" />
        )}
        {calling ? "Calling..." : "Call"}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={cn("h-8 w-8", className)}
          onClick={handleCall}
          disabled={calling}
        >
          {calling ? (
            <PhoneCall className="h-4 w-4 animate-pulse text-green-500" />
          ) : (
            <Phone className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Call {contactName || phoneNumber}
      </TooltipContent>
    </Tooltip>
  );
};
