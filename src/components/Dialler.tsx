import { useState, useEffect, useCallback } from "react";
import { Phone, Delete, X, Search, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface RecentCall {
  id: string;
  phone_number: string | null;
  direction: string;
  duration: number;
  created_at: string;
  contact_name?: string;
}

interface MatchedContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  account_name?: string;
}

const DIAL_KEYS = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
];

export const Dialler = () => {
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [matchedContacts, setMatchedContacts] = useState<MatchedContact[]>([]);
  const [searching, setSearching] = useState(false);

  const handleKeyPress = useCallback((digit: string) => {
    setNumber((prev) => prev + digit);
  }, []);

  const handleBackspace = useCallback(() => {
    setNumber((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setNumber("");
  }, []);

  const handleCall = useCallback(() => {
    if (!number.trim()) return;
    window.open(`tel:${number}`, "_self");
    toast.success(`Initiating call to ${number}`, {
      description: "Opening in your Quo dialler...",
    });
  }, [number]);

  const handleCallContact = useCallback((phone: string, name?: string) => {
    window.open(`tel:${phone}`, "_self");
    toast.success(`Initiating call to ${name || phone}`, {
      description: "Opening in your Quo dialler...",
    });
  }, []);

  // Fetch recent calls
  useEffect(() => {
    if (!open) return;
    const fetchRecent = async () => {
      const { data } = await supabase
        .from("call_logs")
        .select("id, phone_number, direction, duration, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setRecentCalls(data as RecentCall[]);
    };
    fetchRecent();
  }, [open]);

  // Search contacts as user types
  useEffect(() => {
    if (number.length < 3) {
      setMatchedContacts([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, phone, accounts!inner(name)")
        .or(`phone.ilike.%${number}%,first_name.ilike.%${number}%,last_name.ilike.%${number}%`)
        .limit(5);
      if (data) {
        setMatchedContacts(
          data.map((c: any) => ({
            id: c.id,
            first_name: c.first_name,
            last_name: c.last_name,
            phone: c.phone,
            account_name: c.accounts?.name,
          }))
        );
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [number]);

  // Keyboard support
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (/^[0-9*#]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Enter" && number) {
        handleCall();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleKeyPress, handleBackspace, handleCall, number]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 md:bottom-8 md:right-8"
          aria-label="Open dialler"
        >
          <Phone className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="text-lg">Dialler</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="keypad" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 grid w-auto grid-cols-2">
            <TabsTrigger value="keypad">Keypad</TabsTrigger>
            <TabsTrigger value="recent">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Recent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keypad" className="flex-1 flex flex-col mt-0 px-4 pb-4">
            {/* Number display */}
            <div className="relative my-4">
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/[^0-9*#+\s\-()]/g, ""))}
                placeholder="Enter number"
                className="text-center text-2xl font-mono h-14 tracking-widest pr-10"
              />
              {number && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Contact matches */}
            {matchedContacts.length > 0 && (
              <div className="mb-3 space-y-1 max-h-28 overflow-auto">
                {matchedContacts.map((c) => (
                  <button
                    key={c.id}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted text-left text-sm transition-colors"
                    onClick={() => c.phone && handleCallContact(c.phone, `${c.first_name || ""} ${c.last_name || ""}`.trim())}
                  >
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">
                      {c.first_name} {c.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Dial pad */}
            <div className="grid grid-cols-3 gap-2 flex-1 content-center max-w-xs mx-auto w-full">
              {DIAL_KEYS.map(({ digit, letters }) => (
                <button
                  key={digit}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-full aspect-square",
                    "bg-muted/50 hover:bg-muted active:bg-muted/80 transition-colors",
                    "text-foreground select-none cursor-pointer"
                  )}
                  onClick={() => handleKeyPress(digit)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <span className="text-2xl font-semibold leading-none">{digit}</span>
                  {letters && (
                    <span className="text-[10px] text-muted-foreground tracking-widest mt-0.5">
                      {letters}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Action row */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={handleBackspace}
                disabled={!number}
              >
                <Delete className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                onClick={handleCall}
                disabled={!number.trim()}
              >
                <Phone className="h-7 w-7" />
              </Button>
              <div className="h-12 w-12" /> {/* spacer for symmetry */}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full px-4 pb-4">
              {recentCalls.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No recent calls</p>
              ) : (
                <div className="space-y-1">
                  {recentCalls.map((call) => (
                    <button
                      key={call.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                      onClick={() => call.phone_number && handleCallContact(call.phone_number)}
                    >
                      <Phone className={cn(
                        "h-4 w-4 shrink-0",
                        call.direction === "incoming" ? "text-accent-foreground" : "text-primary"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {call.phone_number || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {call.direction} · {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
