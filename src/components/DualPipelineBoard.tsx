import { useState, useMemo } from "react";
import { CreditCard, Zap } from "lucide-react";
import {
  Opportunity,
  OpportunityStage,
  PROCESSING_PIPELINE_STAGES,
  GATEWAY_ONLY_PIPELINE_STAGES,
  getServiceType,
  migrateStage,
} from "@/types/opportunity";
import PipelineColumn from "./PipelineColumn";
import OpportunityDetailModal from "./OpportunityDetailModal";
import { cn } from "@/lib/utils";

interface DualPipelineBoardProps {
  opportunities: Opportunity[];
  onUpdateOpportunity: (id: string, updates: Partial<Opportunity>) => void;
  onAssignmentChange?: (opportunityId: string, assignedTo: string | null) => void;
  onAddNew?: () => void;
  onMarkAsDead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

interface PipelineSectionProps {
  title: string;
  icon: React.ReactNode;
  stages: OpportunityStage[];
  opportunities: Opportunity[];
  onDragStart: (e: React.DragEvent, opportunity: Opportunity) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stage: OpportunityStage) => void;
  onCardClick: (opportunity: Opportunity) => void;
  onAssignmentChange?: (opportunityId: string, assignedTo: string | null) => void;
  onAddNew?: () => void;
  colorAccent: string;
  pipelineType: 'processing' | 'gateway';
}

const PipelineSection = ({
  title,
  icon,
  stages,
  opportunities,
  onDragStart,
  onDragOver,
  onDrop,
  onCardClick,
  onAssignmentChange,
  onAddNew,
  colorAccent,
  pipelineType,
}: PipelineSectionProps) => {
  const totalCount = opportunities.length;

  const getOpportunitiesByStage = (stage: OpportunityStage) => {
    return opportunities
      .filter((o) => o.stage === stage)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  return (
    <div className="flex flex-1 min-h-0 border border-border/40 rounded-lg overflow-hidden bg-card/30">
      {/* Vertical Title Sidebar */}
      <div className={cn(
        "flex flex-col items-center justify-center w-10 flex-shrink-0 border-r border-border/40",
        colorAccent
      )}>
        <div className="flex flex-col items-center gap-2 py-3">
          {icon}
          <span 
            className="text-white font-semibold text-xs whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {title}
          </span>
          <span className="text-white/80 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
            {totalCount}
          </span>
        </div>
      </div>

      {/* Scrollable Pipeline Area */}
      <div 
        className="flex-1 overflow-auto"
        data-pipeline={pipelineType}
      >
        <div className="flex gap-2 p-2 min-w-max h-full">
          {stages.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              opportunities={getOpportunitiesByStage(stage)}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onCardClick={onCardClick}
              onAssignmentChange={onAssignmentChange}
              onAddNew={stage === 'application_started' ? onAddNew : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const DualPipelineBoard = ({
  opportunities,
  onUpdateOpportunity,
  onAssignmentChange,
  onAddNew,
  onMarkAsDead,
  onDelete,
}: DualPipelineBoardProps) => {
  const [draggedOpportunity, setDraggedOpportunity] = useState<Opportunity | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Migrate stages and split opportunities by service type
  const { processingOpportunities, gatewayOpportunities } = useMemo(() => {
    const processing: Opportunity[] = [];
    const gateway: Opportunity[] = [];

    opportunities.forEach((opp) => {
      // Apply stage migration (opportunities -> application_prep)
      const migratedStage = migrateStage(opp.stage);
      const migratedOpp = migratedStage !== opp.stage
        ? { ...opp, stage: migratedStage }
        : opp;

      // Determine service type
      const serviceType = getServiceType(migratedOpp);

      if (serviceType === 'gateway_only') {
        gateway.push(migratedOpp);
      } else {
        processing.push(migratedOpp);
      }
    });

    return { processingOpportunities: processing, gatewayOpportunities: gateway };
  }, [opportunities]);

  const handleDragStart = (e: React.DragEvent, opportunity: Opportunity) => {
    setDraggedOpportunity(opportunity);
    e.dataTransfer.effectAllowed = 'move';
    // Store which pipeline the card came from
    const serviceType = getServiceType(opportunity);
    e.dataTransfer.setData('text/plain', serviceType);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stage: OpportunityStage) => {
    e.preventDefault();
    if (draggedOpportunity && draggedOpportunity.stage !== stage) {
      // Determine target pipeline from the stage
      const targetIsGateway = GATEWAY_ONLY_PIPELINE_STAGES.includes(stage);
      const sourceIsGateway = getServiceType(draggedOpportunity) === 'gateway_only';
      
      const updates: Partial<Opportunity> = { stage };
      
      // If moving between pipelines, update processing_services to reflect the change
      if (targetIsGateway !== sourceIsGateway) {
        if (targetIsGateway) {
          // Moving to gateway pipeline - remove processing services
          updates.processing_services = [];
        } else {
          // Moving to processing pipeline - add default processing service if empty
          if (!draggedOpportunity.processing_services?.length) {
            updates.processing_services = ['Credit Card'];
          }
        }
      }
      
      onUpdateOpportunity(draggedOpportunity.id, updates);
    }
    setDraggedOpportunity(null);
  };

  return (
    <>
      <div className="flex-1 flex flex-col p-3 gap-2 overflow-hidden">
        {/* NMI Payments Pipeline Section */}
        <PipelineSection
          title="NMI Payments Pipeline"
          icon={<CreditCard className="h-4 w-4 text-white" />}
          stages={PROCESSING_PIPELINE_STAGES}
          opportunities={processingOpportunities}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onCardClick={setSelectedOpportunity}
          onAssignmentChange={onAssignmentChange}
          onAddNew={onAddNew}
          colorAccent="bg-primary"
          pipelineType="processing"
        />

        {/* NMI Gateway Pipeline Section */}
        <PipelineSection
          title="NMI Gateway Pipeline"
          icon={<Zap className="h-4 w-4 text-white" />}
          stages={GATEWAY_ONLY_PIPELINE_STAGES}
          opportunities={gatewayOpportunities}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onCardClick={setSelectedOpportunity}
          onAssignmentChange={onAssignmentChange}
          onAddNew={onAddNew}
          colorAccent="bg-teal"
          pipelineType="gateway"
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

export default DualPipelineBoard;
