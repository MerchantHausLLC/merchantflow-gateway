import { useState, useMemo } from "react";
import { Opportunity, OpportunityStage, PROCESSING_PIPELINE_STAGES, GATEWAY_ONLY_PIPELINE_STAGES, getOpportunityPipelineType, PipelineType } from "@/types/opportunity";
import PipelineColumn from "./PipelineColumn";
import OpportunityDetailModal from "./OpportunityDetailModal";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PipelineBoardProps {
  opportunities: Opportunity[];
  onUpdateOpportunity: (id: string, updates: Partial<Opportunity>) => void;
  onAssignmentChange?: (opportunityId: string, assignedTo: string | null) => void;
  onPipelineChange?: (opportunityId: string, pipelineType: PipelineType) => void;
  onAddNew?: () => void;
  onMarkAsDead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

interface PipelineSectionProps {
  title: string;
  pipelineType: PipelineType;
  stages: OpportunityStage[];
  opportunities: Opportunity[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  draggedOpportunity: Opportunity | null;
  onDragStart: (e: React.DragEvent, opportunity: Opportunity) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stage: OpportunityStage) => void;
  onCardClick: (opportunity: Opportunity) => void;
  onAssignmentChange?: (opportunityId: string, assignedTo: string | null) => void;
  onPipelineChange?: (opportunityId: string, pipelineType: PipelineType) => void;
  onAddNew?: () => void;
}

const PipelineSection = ({
  title,
  pipelineType,
  stages,
  opportunities,
  isCollapsed,
  onToggleCollapse,
  onDragStart,
  onDragOver,
  onDrop,
  onCardClick,
  onAssignmentChange,
  onPipelineChange,
  onAddNew,
}: PipelineSectionProps) => {
  const getOpportunitiesByStage = (stage: OpportunityStage) => {
    return opportunities
      .filter((o) => o.stage === stage)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const totalCount = opportunities.length;

  return (
    <div className="flex flex-col min-h-0">
      {/* Section Header */}
      <button
        onClick={onToggleCollapse}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg mb-2 transition-colors",
          "bg-secondary/50 hover:bg-secondary/70 dark:bg-secondary/30 dark:hover:bg-secondary/50",
          "border border-border/50"
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-foreground" />
        )}
        <span className="font-semibold text-sm text-foreground">{title}</span>
        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">
          {totalCount}
        </span>
      </button>

      {/* Pipeline Columns */}
      {!isCollapsed && (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-3 h-full pb-2">
            {stages.map((stage) => (
              <PipelineColumn
                key={`${pipelineType}-${stage}`}
                stage={stage}
                opportunities={getOpportunitiesByStage(stage)}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onCardClick={onCardClick}
                onAssignmentChange={onAssignmentChange}
                onPipelineChange={onPipelineChange}
                onAddNew={stage === 'application_started' ? onAddNew : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PipelineBoard = ({ opportunities, onUpdateOpportunity, onAssignmentChange, onPipelineChange, onAddNew, onMarkAsDead, onDelete }: PipelineBoardProps) => {
  const [draggedOpportunity, setDraggedOpportunity] = useState<Opportunity | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [processingCollapsed, setProcessingCollapsed] = useState(false);
  const [gatewayCollapsed, setGatewayCollapsed] = useState(false);

  // Split opportunities by pipeline type
  const { processingOpportunities, gatewayOpportunities } = useMemo(() => {
    const processing: Opportunity[] = [];
    const gateway: Opportunity[] = [];

    opportunities.forEach(opp => {
      const pipelineType = getOpportunityPipelineType(opp);
      if (pipelineType === 'processing') {
        processing.push(opp);
      } else {
        gateway.push(opp);
      }
    });

    return { processingOpportunities: processing, gatewayOpportunities: gateway };
  }, [opportunities]);

  const handleDragStart = (e: React.DragEvent, opportunity: Opportunity) => {
    setDraggedOpportunity(opportunity);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stage: OpportunityStage) => {
    e.preventDefault();
    if (draggedOpportunity && draggedOpportunity.stage !== stage) {
      onUpdateOpportunity(draggedOpportunity.id, { stage });
    }
    setDraggedOpportunity(null);
  };

  return (
    <>
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
        {/* Processing Pipeline Section */}
        <PipelineSection
          title="Processing Pipeline"
          pipelineType="processing"
          stages={PROCESSING_PIPELINE_STAGES}
          opportunities={processingOpportunities}
          isCollapsed={processingCollapsed}
          onToggleCollapse={() => setProcessingCollapsed(!processingCollapsed)}
          draggedOpportunity={draggedOpportunity}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onCardClick={setSelectedOpportunity}
          onAssignmentChange={onAssignmentChange}
          onPipelineChange={onPipelineChange}
          onAddNew={onAddNew}
        />

        {/* Gateway Only Pipeline Section */}
        <PipelineSection
          title="Gateway Only Pipeline"
          pipelineType="gateway_only"
          stages={GATEWAY_ONLY_PIPELINE_STAGES}
          opportunities={gatewayOpportunities}
          isCollapsed={gatewayCollapsed}
          onToggleCollapse={() => setGatewayCollapsed(!gatewayCollapsed)}
          draggedOpportunity={draggedOpportunity}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onCardClick={setSelectedOpportunity}
          onAssignmentChange={onAssignmentChange}
          onPipelineChange={onPipelineChange}
          onAddNew={onAddNew}
        />
      </div>

      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onUpdate={(updates) => {
          if (selectedOpportunity) {
            onUpdateOpportunity(selectedOpportunity.id, updates);
          }
        }}
        onMarkAsDead={onMarkAsDead}
        onDelete={onDelete}
      />
    </>
  );
};

export default PipelineBoard;
