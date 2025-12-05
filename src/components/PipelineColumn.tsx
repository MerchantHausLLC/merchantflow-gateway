import { useState } from "react";
import { Opportunity, OpportunityStage, STAGE_CONFIG } from "@/types/opportunity";
import OpportunityCard from "./OpportunityCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronsDownUp, ChevronsUpDown, Plus } from "lucide-react";

interface PipelineColumnProps {
  stage: OpportunityStage;
  opportunities: Opportunity[];
  onDragStart: (e: React.DragEvent, opportunity: Opportunity) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stage: OpportunityStage) => void;
  onCardClick: (opportunity: Opportunity) => void;
  onAssignmentChange?: (opportunityId: string, assignedTo: string | null) => void;
  onAddNew?: () => void;
}

const PipelineColumn = ({
  stage,
  opportunities,
  onDragStart,
  onDragOver,
  onDrop,
  onCardClick,
  onAssignmentChange,
  onAddNew,
}: PipelineColumnProps) => {
  const config = STAGE_CONFIG[stage];
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());
  const [allCollapsed, setAllCollapsed] = useState(false);

  const toggleCardCollapse = (id: string) => {
    setCollapsedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllCards = () => {
    if (allCollapsed) {
      setCollapsedCards(new Set());
    } else {
      setCollapsedCards(new Set(opportunities.map(o => o.id)));
    }
    setAllCollapsed(!allCollapsed);
  };

  return (
    <div
      className="flex-shrink-0 w-72 flex flex-col bg-muted/30 rounded-lg border border-border/50"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage)}
    >
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${config.colorClass}`} />
          <h2 className="font-semibold text-sm text-foreground">{config.label}</h2>
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {opportunities.length}
          </span>
          {stage === 'application_started' && onAddNew && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
              onClick={onAddNew}
              title="Add new application"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          {opportunities.length > 0 && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={toggleAllCards}
              title={allCollapsed ? "Expand all" : "Collapse all"}
            >
              {allCollapsed ? (
                <ChevronsUpDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronsDownUp className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              onDragStart={onDragStart}
              onClick={() => onCardClick(opportunity)}
              onAssignmentChange={onAssignmentChange}
              isCollapsed={collapsedCards.has(opportunity.id)}
              onToggleCollapse={() => toggleCardCollapse(opportunity.id)}
            />
          ))}
          
          {opportunities.length === 0 && (
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-border/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Drop applications here</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PipelineColumn;