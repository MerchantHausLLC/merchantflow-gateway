import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Check, X, Minus } from "lucide-react";

type SupportStatus = "full" | "partial" | "none";

interface Processor {
  name: string;
  region: string;
  creditCard: SupportStatus;
  debit: SupportStatus;
  ach: SupportStatus;
  applePay: SupportStatus;
  googlePay: SupportStatus;
  level3: SupportStatus;
  tokenization: SupportStatus;
  recurring: SupportStatus;
  threeDS: SupportStatus;
  multiCurrency: SupportStatus;
  tapToPay: SupportStatus;
  emv: SupportStatus;
}

const processors: Processor[] = [
  { name: "Elavon", region: "US / EU", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "full", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "full", tapToPay: "full", emv: "full" },
  { name: "First Data (Fiserv)", region: "US / CA", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "full", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "partial", tapToPay: "full", emv: "full" },
  { name: "TSYS (Global Payments)", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "full", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "partial", tapToPay: "full", emv: "full" },
  { name: "Worldpay (FIS)", region: "Global", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "full", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "full", tapToPay: "full", emv: "full" },
  { name: "Chase Paymentech", region: "US / CA", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "full", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "partial", tapToPay: "full", emv: "full" },
  { name: "Heartland", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "none", tapToPay: "full", emv: "full" },
  { name: "Paysafe", region: "Global", creditCard: "full", debit: "full", ach: "partial", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "full", tapToPay: "partial", emv: "full" },
  { name: "Adyen", region: "Global", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "full", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "full", tapToPay: "full", emv: "full" },
  { name: "Stripe", region: "Global", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "full", tapToPay: "full", emv: "partial" },
  { name: "Payflow (PayPal)", region: "US / CA / AU", creditCard: "full", debit: "full", ach: "partial", applePay: "partial", googlePay: "partial", level3: "partial", tokenization: "full", recurring: "full", threeDS: "partial", multiCurrency: "partial", tapToPay: "none", emv: "none" },
  { name: "Moneris", region: "CA", creditCard: "full", debit: "full", ach: "none", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "partial", tapToPay: "full", emv: "full" },
  { name: "Bambora (Worldline)", region: "CA / EU", creditCard: "full", debit: "full", ach: "none", applePay: "full", googlePay: "full", level3: "none", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "partial", tapToPay: "partial", emv: "full" },
  { name: "Nuvei", region: "Global", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "full", tapToPay: "full", emv: "full" },
  { name: "Priority Payment Systems", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "full", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "none", tapToPay: "full", emv: "full" },
  { name: "USAePay", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "partial", googlePay: "partial", level3: "partial", tokenization: "full", recurring: "full", threeDS: "partial", multiCurrency: "none", tapToPay: "partial", emv: "partial" },
  { name: "Authorize.net", region: "US / CA / UK / EU", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "partial", tapToPay: "none", emv: "none" },
  { name: "Braintree", region: "Global", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "none", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "full", tapToPay: "partial", emv: "partial" },
  { name: "CyberSource", region: "Global", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "full", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "full", tapToPay: "partial", emv: "full" },
  { name: "Payeezy (First Data)", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "partial", tapToPay: "full", emv: "full" },
  { name: "Vantiv (Worldpay)", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "full", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "partial", tapToPay: "full", emv: "full" },
  { name: "Bluefin", region: "US", creditCard: "full", debit: "full", ach: "partial", applePay: "partial", googlePay: "partial", level3: "none", tokenization: "full", recurring: "full", threeDS: "partial", multiCurrency: "none", tapToPay: "partial", emv: "full" },
  { name: "PayTrace", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "none", googlePay: "none", level3: "full", tokenization: "full", recurring: "full", threeDS: "none", multiCurrency: "none", tapToPay: "none", emv: "partial" },
  { name: "TransFirst", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "partial", googlePay: "partial", level3: "partial", tokenization: "full", recurring: "full", threeDS: "partial", multiCurrency: "none", tapToPay: "partial", emv: "full" },
  { name: "Fattmerchant (Stax)", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "none", tapToPay: "full", emv: "full" },
  { name: "Square", region: "US / CA / AU / UK / JP", creditCard: "full", debit: "full", ach: "partial", applePay: "full", googlePay: "full", level3: "none", tokenization: "full", recurring: "partial", threeDS: "partial", multiCurrency: "partial", tapToPay: "full", emv: "full" },
  { name: "Clearent", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "none", tapToPay: "full", emv: "full" },
  { name: "iATS Payments", region: "US / CA / UK", creditCard: "full", debit: "partial", ach: "full", applePay: "none", googlePay: "none", level3: "none", tokenization: "full", recurring: "full", threeDS: "partial", multiCurrency: "partial", tapToPay: "none", emv: "none" },
  { name: "PayJunction", region: "US", creditCard: "full", debit: "full", ach: "partial", applePay: "none", googlePay: "none", level3: "partial", tokenization: "full", recurring: "full", threeDS: "none", multiCurrency: "none", tapToPay: "none", emv: "full" },
  { name: "Converge (Elavon)", region: "US / CA", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "full", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "partial", tapToPay: "full", emv: "full" },
  { name: "Shift4", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "none", tapToPay: "full", emv: "full" },
  { name: "Helcim", region: "US / CA", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "partial", tapToPay: "full", emv: "full" },
  { name: "CardConnect", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "full", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "none", tapToPay: "full", emv: "full" },
  { name: "Repay", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "partial", googlePay: "partial", level3: "partial", tokenization: "full", recurring: "full", threeDS: "partial", multiCurrency: "none", tapToPay: "partial", emv: "partial" },
  { name: "PaySimple", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "none", googlePay: "none", level3: "none", tokenization: "full", recurring: "full", threeDS: "none", multiCurrency: "none", tapToPay: "none", emv: "none" },
  { name: "Dharma Merchant Services", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "none", tapToPay: "partial", emv: "full" },
  { name: "Verifi (Visa)", region: "Global", creditCard: "full", debit: "full", ach: "none", applePay: "none", googlePay: "none", level3: "none", tokenization: "full", recurring: "partial", threeDS: "full", multiCurrency: "full", tapToPay: "none", emv: "none" },
  { name: "Cayan (TSYS Genius)", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "none", tapToPay: "full", emv: "full" },
  { name: "Payroc", region: "US / CA", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "partial", tapToPay: "full", emv: "full" },
  { name: "North American Bancard", region: "US", creditCard: "full", debit: "full", ach: "full", applePay: "full", googlePay: "full", level3: "partial", tokenization: "full", recurring: "full", threeDS: "full", multiCurrency: "none", tapToPay: "full", emv: "full" },
  { name: "Pivotal Payments", region: "US / CA", creditCard: "full", debit: "full", ach: "full", applePay: "partial", googlePay: "partial", level3: "partial", tokenization: "full", recurring: "full", threeDS: "partial", multiCurrency: "partial", tapToPay: "partial", emv: "full" },
];

const columns: { key: keyof Processor; label: string; shortLabel: string }[] = [
  { key: "region", label: "Region", shortLabel: "Region" },
  { key: "creditCard", label: "Credit Card", shortLabel: "CC" },
  { key: "debit", label: "Debit", shortLabel: "Debit" },
  { key: "ach", label: "ACH / EFT", shortLabel: "ACH" },
  { key: "applePay", label: "Apple Pay", shortLabel: "Apple" },
  { key: "googlePay", label: "Google Pay", shortLabel: "Google" },
  { key: "level3", label: "Level III Data", shortLabel: "L3" },
  { key: "tokenization", label: "Tokenization", shortLabel: "Token" },
  { key: "recurring", label: "Recurring", shortLabel: "Recur" },
  { key: "threeDS", label: "3D Secure", shortLabel: "3DS" },
  { key: "multiCurrency", label: "Multi-Currency", shortLabel: "Multi$" },
  { key: "tapToPay", label: "Tap to Pay", shortLabel: "Tap" },
  { key: "emv", label: "EMV", shortLabel: "EMV" },
];

function StatusIcon({ status }: { status: SupportStatus }) {
  if (status === "full") return <Check className="h-4 w-4 text-emerald-400" />;
  if (status === "partial") return <Minus className="h-4 w-4 text-amber-400" />;
  return <X className="h-4 w-4 text-muted-foreground/40" />;
}

const SupportedProcessors = () => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return processors;
    const q = search.toLowerCase();
    return processors.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <AppLayout pageTitle="Supported Processors">
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mt-1">
              Feature compatibility across our processor network. Scroll horizontally to view all capabilities.
            </p>
          </div>
          <div className="relative w-full sm:w-72 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search processors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-card border-border"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> Full Support</span>
          <span className="flex items-center gap-1.5"><Minus className="h-3.5 w-3.5 text-amber-400" /> Partial</span>
          <span className="flex items-center gap-1.5"><X className="h-3.5 w-3.5 text-muted-foreground/40" /> Not Supported</span>
          <Badge variant="secondary" className="text-xs ml-auto">{filtered.length} processors</Badge>
        </div>

        {/* Table container */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse processor-table">
              <thead>
                <tr>
                  <th className="sticky top-0 left-0 z-30 bg-card border-b border-r border-border px-3 py-2.5 sm:px-4 sm:py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap min-w-[160px] sm:min-w-[200px]">
                    Processor
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="sticky top-0 z-20 bg-card border-b border-border px-2 py-2.5 sm:px-3 sm:py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">{col.label}</span>
                      <span className="sm:hidden">{col.shortLabel}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((proc, idx) => (
                  <tr
                    key={proc.name}
                    className={`
                      transition-colors hover:bg-muted/30
                      ${idx % 2 === 0 ? "bg-transparent" : "bg-muted/10"}
                    `}
                  >
                    <td className="sticky left-0 z-10 bg-card border-r border-border px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-medium text-foreground whitespace-nowrap min-w-[160px] sm:min-w-[200px]">
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm">{proc.name}</span>
                      </div>
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-2 py-2 sm:px-3 sm:py-2.5 text-center whitespace-nowrap border-b border-border/30"
                      >
                        {col.key === "region" ? (
                          <span className="text-xs text-muted-foreground">{proc.region}</span>
                        ) : (
                          <span className="inline-flex items-center justify-center">
                            <StatusIcon status={proc[col.key] as SupportStatus} />
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      No processors found matching "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SupportedProcessors;
