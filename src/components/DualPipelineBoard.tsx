import { useState, useMemo } from "react";
import { CreditCard, Zap } from "lucide-react";
import {
  Opportunity,
  OpportunityStage,
  PROCESSING_PIPELINE_STAGES,
  GATEWAY_ONLY_PIPELINE_STAGES,
  STAGE_CONFIG,
  getServiceType,
  migrateStage,
} from "@/types/opportunity";
import PipelineColumn from "./PipelineColumn";
import OpportunityDetailModal from "./OpportunityDetailModal";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Pipeline                                                                    */
/* -------------------------------------------------------------------------- */

interface PipelineProps {
  title: string;
  icon: React.ReactNode;
  stages: OpportunityStage[];
  opportunities: Opportunity[];
  pipelineType: "processing" | "gateway";
  accentClass: string;
  onDragStart: (e: React.DragEvent, opportunity: Opportunity) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stage: OpportunityStage) => void;
  onCardClick: (opportunity: Opportunity) => void;
  onAssignmentChange?: (id: string, assignedTo: string | null) => void;
  onAddNew?: () => void;
}

function Pipeline({
  title,
  icon,
  stages,
  opportunities,
  pipelineType,
  accentClass,
  onDragStart,
  onDragOver,
  onDrop,
  onCardClick,
  onAssignmentChange,
  onAddNew,
}: PipelineProps) {
  const getByStage = (stage: OpportunityStage) =>
    opportunities
      .filter((o) => o.stage === stage)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );

  return (
    <section
      data-pipeline={pipelineType}
      className="relative flex flex-col min-h-[420px] border border-border/40 rounded-lg bg-card/30 overflow-hidden"
    >
      {/* Pipeline Header */}
      <div
        className={cn(
          "sticky top-0 z-20 flex items-center gap-2 px-3 py-2 border-b border-border/40",
          accentClass
        )}
      >
        {icon}
        <span className="text-sm font-semibold text-white">{title}</span>
        <span className="ml-auto text-xs text-white/80">
          {opportunities.length}
        </span>
      </div>

      {/* Horizontal Scroll Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="min-w-max flex flex-col">
          {/* Column Headers */}
          <div className="sticky top-[40px] z-10 flex gap-2 px-2 pt-2 bg-card/30">
            {stages.map((stage) => {
              const config = STAGE_CONFIG[stage];
              const count = getByStage(stage).length;

              return (
                <div
                  key={stage}
                  className={cn(
                    "w-[260px] flex-shrink-0 rounded-t-md px-2 py-1",
                    config.headerClass
                  )}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-white">
                    <span className="truncate">{config.label}</span>
                    <span className="text-[10px] bg-white/20 px-1 rounded">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Columns */}
          <div className="flex gap-2 px-2 pb-2">
            {stages.map((stage) => (
              <PipelineColumn
                key={stage}
                stage={stage}
                opportunities={getByStage(stage)}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onCardClick={onCardClick}
                onAssignmentChange={onAssignmentChange}
                onAddNew={
                  stage === "application_started" ? onAddNew : undefined
                }
                hideHeader
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Page Layout                                                                 */
/* -------------------------------------------------------------------------- */

interface Props {
  opportunities: Opportunity[];
  onUpdateOpportunity: (id: string, updates: Partial<Opportunity>) => void;
  onAssignmentChange?: (id: string, assignedTo: string | null) => void;
  onAddNew?: () => void;
  onMarkAsDead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function DualPipelineBoard({
  opportunities,
  onUpdateOpportunity,
  onAssignmentChange,
  onAddNew,
  onMarkAsDead,
  onDelete,
}: Props) {
  const [dragged, setDragged] = useState<Opportunity | null>(null);
  const [selected, setSelected] = useState<Opportunity | null>(null);

  const { processing, gateway } = useMemo(() => {
    const processing: Opportunity[] = [];
    const gateway: Opportunity[] = [];

    for (const opp of opportunities) {
      const stage = migrateStage(opp.stage);
      const migrated = stage !== opp.stage ? { ...opp, stage } : opp;

      getServiceType(migrated) === "gateway_only"
        ? gateway.push(migrated)
        : processing.push(migrated);
    }

    return { processing, gateway };
  }, [opportunities]);

  const onDragStart = (e: React.DragEvent, opp: Opportunity) => {
    setDragged(opp);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent, stage: OpportunityStage) => {
    e.preventDefault();
    if (!dragged || dragged.stage === stage) return;

    const targetGateway = GATEWAY_ONLY_PIPELINE_STAGES.includes(stage);
    const sourceGateway = getServiceType(dragged) === "gateway_only";

    const updates: Partial<Opportunity> = { stage };

    if (targetGateway !== sourceGateway) {
      updates.processing_services = targetGateway
        ? []
        : dragged.processing_services?.length
        ? dragged.processing_services
        : ["Credit Card"];
    }

    onUpdateOpportunity(dragged.id, updates);
    setDragged(null);
  };

  return (
    <>
      {/* Page-level vertical scroll ONLY */}
      <div className="flex flex-col gap-3 p-3 overflow-y-auto">
        <Pipeline
          title="NMI Payments Pipeline"
          icon={<CreditCard className="h-4 w-4 text-white" />}
          stages={PROCESSING_PIPELINE_STAGES}
          opportunities={processing}
          pipelineType="processing"
          accentClass="bg-primary"
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onCardClick={setSelected}
          onAssignmentChange={onAssignmentChange}
          onAddNew={onAddNew}
        />

        <Pipeline
          title="NMI Gateway Pipeline"
          icon={<Zap className="h-4 w-4 text-white" />}
          stages={GATEWAY_ONLY_PIPELINE_STAGES}
          opportunities={gateway}
          pipelineType="gateway"
          accentClass="bg-teal"
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onCardClick={setSelected}
          onAssignmentChange={onAssignmentChange}
          onAddNew={onAddNew}
        />
      </div>

      <OpportunityDetailModal
        opportunity={selected}
        onClose={() => setSelected(null)}
        onUpdate={(updates) =>
          selected && onUpdateOpportunity(selected.id, updates)
        }
        onMarkAsDead={onMarkAsDead}
        onDelete={onDelete}
      />
    </>
  );
}
