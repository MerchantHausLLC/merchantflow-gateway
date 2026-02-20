import * as React from "react";
import {
  PROCESSING_PIPELINE_STAGES,
  GATEWAY_ONLY_PIPELINE_STAGES,
  STAGE_CONFIG,
  getServiceType,
  migrateStage,
  type Opportunity,
  type OpportunityStage,
} from "@/types/opportunity";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { X, ArrowLeftRight, Skull, Trash2, Save } from "lucide-react";

type Props = {
  opportunity: Opportunity | null;
  onClose: () => void;
  onUpdate: (updates: Partial<Opportunity>) => void;
  onMarkAsDead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onConvertToGateway?: (opportunity: Opportunity) => Promise<void> | void;
  onMoveToProcessing?: (opportunity: Opportunity) => Promise<void> | void;
  hasGatewayOpportunity?: boolean;
};

function safeLabel(v: unknown, fallback = "—") {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "string" && v.trim() === "") return fallback;
  return String(v);
}

// Neo-brutalist helpers (intentionally loud)
const NB = {
  shell:
    "border-4 border-black bg-[#F8F7F2] text-black shadow-[10px_10px_0_0_#000] rounded-none p-0 overflow-hidden",
  topbar:
    "flex items-start justify-between gap-3 border-b-4 border-black bg-[#FFD400] p-4",
  title:
    "font-black tracking-tight text-xl sm:text-2xl leading-none uppercase",
  sub: "text-sm font-semibold opacity-90",
  chip:
    "inline-flex items-center gap-2 border-2 border-black bg-white px-2 py-1 text-xs font-extrabold uppercase",
  section:
    "border-t-4 border-black p-4 sm:p-5 bg-white/70",
  sectionTitle:
    "text-xs font-black uppercase tracking-wider mb-2",
  input:
    "w-full border-2 border-black bg-white px-3 py-2 text-sm font-semibold outline-none focus:shadow-[4px_4px_0_0_#000] focus:translate-x-[-1px] focus:translate-y-[-1px] transition",
  textarea:
    "w-full min-h-[110px] border-2 border-black bg-white px-3 py-2 text-sm font-semibold outline-none focus:shadow-[4px_4px_0_0_#000] focus:translate-x-[-1px] focus:translate-y-[-1px] transition resize-y",
  divider:
    "h-2 border-y-4 border-black bg-[#00D4FF]",
  actionRow:
    "flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between",
  ctaRow:
    "flex flex-wrap gap-2 justify-end",
};

export default function OpportunityDetailModal({
  opportunity,
  onClose,
  onUpdate,
  onMarkAsDead,
  onDelete,
  onConvertToGateway,
  onMoveToProcessing,
  hasGatewayOpportunity,
}: Props) {
  const open = !!opportunity;

  const [draft, setDraft] = React.useState<Partial<Opportunity>>({});
  React.useEffect(() => {
    // Reset draft when changing records
    if (opportunity) setDraft({});
  }, [opportunity?.id]);

  if (!opportunity) return null;

  const serviceType = getServiceType(opportunity); // your helper
  const isGateway = serviceType === "gateway" || serviceType === "gateway_only";
  const stages = (isGateway ? GATEWAY_ONLY_PIPELINE_STAGES : PROCESSING_PIPELINE_STAGES) as OpportunityStage[];

  const currentStage = (draft.stage ?? opportunity.stage) as OpportunityStage;
  const stageCfg = STAGE_CONFIG[currentStage] ?? { label: currentStage, color: "hsl(var(--primary))" };

  const headline =
    // Try common names without assuming too hard
    (opportunity as any).company_name ||
    (opportunity as any).merchant_name ||
    (opportunity as any).name ||
    (opportunity as any).business_name ||
    `Opportunity #${safeLabel(opportunity.id)}`;

  const contactLine = [
    (opportunity as any).contact_name,
    (opportunity as any).email,
    (opportunity as any).phone,
  ]
    .filter(Boolean)
    .join(" • ");

  const stagePillStyle: React.CSSProperties = {
    // keep your config color but make it brutalist
    borderColor: "#000",
    background: "#fff",
  };

  const commit = () => {
    if (Object.keys(draft).length === 0) return;
    onUpdate(draft);
    setDraft({});
  };

  const setField = <K extends keyof Opportunity>(key: K, value: Opportunity[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          "max-w-[860px] p-0 border-0 bg-transparent shadow-none",
        )}
      >
        <div className={NB.shell}>
          {/* TOP BAR */}
          <div className={NB.topbar}>
            <div className="min-w-0">
              <DialogHeader>
                <DialogTitle className={NB.title}>
                  {safeLabel(headline)}
                </DialogTitle>
                <DialogDescription className={cn(NB.sub, "truncate")}>
                  {contactLine ? contactLine : "No contact details yet."}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={NB.chip} style={stagePillStyle}>
                  <span
                    className="inline-block h-2.5 w-2.5 border-2 border-black"
                    style={{ background: stageCfg.color || "#000" }}
                  />
                  {safeLabel(stageCfg.label, safeLabel(currentStage))}
                </span>

                <span className={cn(NB.chip, "bg-[#00D4FF]")}>
                  {isGateway ? "Gateway" : "Payments"}
                </span>

                {hasGatewayOpportunity && !isGateway && (
                  <span className={cn(NB.chip, "bg-[#FF4DCA]")}>
                    Has gateway opp
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="h-10 w-10 rounded-none border-4 border-black bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0_0_#000] transition"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className={NB.divider} />

          {/* BODY */}
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* LEFT: Editable core */}
            <div className="lg:col-span-3">
              <div className={NB.section}>
                <div className={NB.sectionTitle}>Stage</div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    className={NB.input}
                    value={currentStage}
                    onChange={(e) => {
                      const next = e.target.value as OpportunityStage;
                      // migrateStage is your helper, in case pipeline changes need mapping
                      const migrated = migrateStage(opportunity, next);
                      setField("stage" as any, migrated as any);
                    }}
                  >
                    {stages.map((s) => (
                      <option key={s} value={s}>
                        {safeLabel(STAGE_CONFIG[s]?.label, s)}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <span className={cn(NB.chip, "bg-white")}>
                      ID: {safeLabel(opportunity.id)}
                    </span>
                  </div>
                </div>
              </div>

              <div className={NB.section}>
                <div className={NB.sectionTitle}>Notes</div>
                <textarea
                  className={NB.textarea}
                  value={safeLabel((draft as any).notes ?? (opportunity as any).notes, "")}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value as any }))}
                  placeholder="Drop the gritty details… objections, next steps, key dates."
                />
              </div>

              <div className={NB.section}>
                <div className={NB.sectionTitle}>Quick fields</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    className={NB.input}
                    value={safeLabel((draft as any).contact_name ?? (opportunity as any).contact_name, "")}
                    onChange={(e) => setDraft((d) => ({ ...d, contact_name: e.target.value as any }))}
                    placeholder="Contact name"
                  />
                  <input
                    className={NB.input}
                    value={safeLabel((draft as any).email ?? (opportunity as any).email, "")}
                    onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value as any }))}
                    placeholder="Email"
                  />
                  <input
                    className={NB.input}
                    value={safeLabel((draft as any).phone ?? (opportunity as any).phone, "")}
                    onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value as any }))}
                    placeholder="Phone"
                  />
                  <input
                    className={NB.input}
                    value={safeLabel((draft as any).company_name ?? (opportunity as any).company_name ?? (opportunity as any).merchant_name, "")}
                    onChange={(e) => setDraft((d) => ({ ...d, company_name: e.target.value as any }))}
                    placeholder="Company / Merchant"
                  />
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDraft({})}
                    className="rounded-none border-4 border-black bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0_0_#000] transition"
                    disabled={Object.keys(draft).length === 0}
                  >
                    Reset
                  </Button>

                  <Button
                    onClick={commit}
                    className="rounded-none border-4 border-black bg-[#00D4FF] text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0_0_#000] transition"
                    disabled={Object.keys(draft).length === 0}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save changes
                  </Button>
                </div>
              </div>
            </div>

            {/* RIGHT: Actions / meta */}
            <div className="lg:col-span-2 border-t-4 lg:border-t-0 lg:border-l-4 border-black bg-[#F8F7F2]">
              <div className={NB.section}>
                <div className={NB.sectionTitle}>Actions</div>

                <div className={NB.actionRow}>
                  <div className="text-sm font-semibold">
                    Keep it moving. No excuses. 😈
                  </div>
                  <div className={NB.ctaRow}>
                    {!isGateway && onConvertToGateway && (
                      <Button
                        variant="outline"
                        onClick={() => onConvertToGateway(opportunity)}
                        className="rounded-none border-4 border-black bg-[#FF4DCA] text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0_0_#000] transition"
                        disabled={!!hasGatewayOpportunity}
                        title={hasGatewayOpportunity ? "Already has a gateway opportunity" : "Convert to gateway"}
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        Convert → Gateway
                      </Button>
                    )}

                    {isGateway && onMoveToProcessing && (
                      <Button
                        variant="outline"
                        onClick={() => onMoveToProcessing(opportunity)}
                        className="rounded-none border-4 border-black bg-[#FFD400] text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0_0_#000] transition"
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        Move → Payments
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className={NB.section}>
                <div className={NB.sectionTitle}>Danger zone</div>

                <div className="flex flex-col gap-2">
                  {onMarkAsDead && (
                    <Button
                      variant="outline"
                      onClick={() => onMarkAsDead(opportunity.id)}
                      className="justify-start rounded-none border-4 border-black bg-white text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0_0_#000] transition"
                    >
                      <Skull className="h-4 w-4 mr-2" />
                      Mark as dead
                    </Button>
                  )}

                  {onDelete && (
                    <Button
                      variant="outline"
                      onClick={() => onDelete(opportunity.id)}
                      className="justify-start rounded-none border-4 border-black bg-[#FF3B30] text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0_0_#000] transition"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete opportunity
                    </Button>
                  )}
                </div>

                <div className="mt-4 text-xs font-semibold">
                  Tip: brutalist UI works best when actions are **obvious** and **fast**.
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER STRIP */}
          <div className="border-t-4 border-black bg-black text-white px-4 py-2 text-xs font-black uppercase tracking-widest">
            Built for speed • zero fluff • maximum signal
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
