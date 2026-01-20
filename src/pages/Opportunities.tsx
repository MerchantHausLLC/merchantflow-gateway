import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/contexts/TasksContext";
import { 
  Opportunity, 
  OpportunityStage, 
  STAGE_CONFIG, 
  TEAM_MEMBERS, 
  migrateStage, 
  getServiceType,
  EMAIL_TO_USER,
  PROCESSING_PIPELINE_STAGES,
  GATEWAY_ONLY_PIPELINE_STAGES
} from "@/types/opportunity";
import { sendStageChangeEmail } from "@/hooks/useEmailNotifications";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Building2, 
  User, 
  Calendar, 
  Clock, 
  ArrowUpDown, 
  Eye,
  Zap,
  CreditCard,
  MoreHorizontal,
  ChevronDown,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import OpportunityDetailModal from "@/components/OpportunityDetailModal";
import NewApplicationModal from "@/components/NewApplicationModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SortableTableHead } from "@/components/SortableTableHead";

type SortField = 'name' | 'stage' | 'pipeline' | 'owner' | 'tasks' | 'progress' | 'created' | 'updated';
type SortDirection = 'asc' | 'desc';

const Opportunities = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { tasks } = useTasks();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [pipelineFilter, setPipelineFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [reactivateConfirm, setReactivateConfirm] = useState<{ opp: Opportunity; assignee: string } | null>(null);

  // Handle ?new=true query param from sidebar navigation
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowNewModal(true);
      // Clear the query param
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          account:accounts(*),
          contact:contacts(*),
          wizard_state:onboarding_wizard_states(*)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((opp: any) => ({
        ...opp,
        stage: migrateStage(opp.stage),
        wizard_state: Array.isArray(opp.wizard_state) ? opp.wizard_state[0] : opp.wizard_state,
      }));

      setOpportunities(mapped);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast({ title: "Error loading opportunities", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOpportunities();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('opportunities-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'opportunities' }, fetchOpportunities)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOpportunities]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field as SortField);
      setSortDirection('asc');
    }
  };

  const getTaskCount = (opportunityId: string) => {
    return tasks.filter(t => t.relatedOpportunityId === opportunityId && t.status === 'open').length;
  };

  const filteredOpportunities = useMemo(() => {
    let filtered = [...opportunities];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(opp => 
        statusFilter === "active" ? opp.status !== 'dead' : opp.status === 'dead'
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(opp =>
        opp.account?.name?.toLowerCase().includes(query) ||
        opp.contact?.email?.toLowerCase().includes(query) ||
        opp.contact?.first_name?.toLowerCase().includes(query) ||
        opp.contact?.last_name?.toLowerCase().includes(query)
      );
    }

    // Stage filter
    if (stageFilter !== "all") {
      filtered = filtered.filter(opp => opp.stage === stageFilter);
    }

    // Owner filter
    if (ownerFilter !== "all") {
      if (ownerFilter === "unassigned") {
        filtered = filtered.filter(opp => !opp.assigned_to);
      } else {
        filtered = filtered.filter(opp => opp.assigned_to === ownerFilter);
      }
    }

    // Pipeline filter
    if (pipelineFilter !== "all") {
      filtered = filtered.filter(opp => getServiceType(opp) === pipelineFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = (a.account?.name || '').localeCompare(b.account?.name || '');
          break;
        case 'stage':
          comparison = a.stage.localeCompare(b.stage);
          break;
        case 'pipeline':
          comparison = getServiceType(a).localeCompare(getServiceType(b));
          break;
        case 'owner':
          comparison = (a.assigned_to || 'zzz').localeCompare(b.assigned_to || 'zzz');
          break;
        case 'tasks':
          comparison = getTaskCount(a.id) - getTaskCount(b.id);
          break;
        case 'progress':
          comparison = (a.wizard_state?.progress || 0) - (b.wizard_state?.progress || 0);
          break;
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [opportunities, searchQuery, stageFilter, ownerFilter, pipelineFilter, statusFilter, sortField, sortDirection, tasks]);

  // Stats
  const stats = useMemo(() => {
    const active = opportunities.filter(o => o.status !== 'dead');
    const byStage: Record<string, number> = {};
    active.forEach(o => {
      byStage[o.stage] = (byStage[o.stage] || 0) + 1;
    });
    
    return {
      total: active.length,
      new: byStage['application_started'] || 0,
      inProgress: active.filter(o => !['application_started', 'live_activated', 'closed_won', 'closed_lost'].includes(o.stage)).length,
      won: (byStage['live_activated'] || 0) + (byStage['closed_won'] || 0),
      lost: opportunities.filter(o => o.status === 'dead').length,
    };
  }, [opportunities]);

  const navigateToOpportunity = (opp: Opportunity) => {
    navigate(`/opportunities/${opp.id}`);
  };

  const handleAssignmentChange = (opp: Opportunity, newAssignee: string) => {
    const wasArchived = opp.status === 'dead';
    const assigneeValue = newAssignee === 'unassigned' ? null : newAssignee;
    
    // Show confirmation if reactivating an archived opportunity
    if (wasArchived && assigneeValue) {
      setReactivateConfirm({ opp, assignee: newAssignee });
      return;
    }
    
    // Otherwise just update assignment directly
    performAssignmentUpdate(opp, newAssignee, false);
  };

  const performAssignmentUpdate = async (opp: Opportunity, newAssignee: string, isReactivation: boolean) => {
    const assigneeValue = newAssignee === 'unassigned' ? null : newAssignee;
    
    const updatePayload: { assigned_to: string | null; status?: string; stage?: string } = {
      assigned_to: assigneeValue,
    };
    
    if (isReactivation && assigneeValue) {
      updatePayload.status = 'active';
      const serviceType = getServiceType(opp);
      const validStages = serviceType === 'gateway_only' 
        ? GATEWAY_ONLY_PIPELINE_STAGES 
        : PROCESSING_PIPELINE_STAGES;
      if (!validStages.includes(opp.stage as OpportunityStage)) {
        updatePayload.stage = 'application_started';
      }
    }
    
    const { error } = await supabase
      .from('opportunities')
      .update(updatePayload)
      .eq('id', opp.id);
    
    if (error) {
      toast({ title: "Failed to update assignment", variant: "destructive" });
      return;
    }
    
    await supabase.from('activities').insert({
      opportunity_id: opp.id,
      type: isReactivation ? 'reactivated' : 'assignment_change',
      description: isReactivation 
        ? `Reactivated and assigned to ${assigneeValue}`
        : `Assigned to ${assigneeValue || 'Unassigned'}`,
      user_id: user?.id,
      user_email: user?.email,
    });
    
    toast({ 
      title: isReactivation 
        ? `Reactivated and assigned to ${assigneeValue}` 
        : `Assigned to ${assigneeValue || 'Unassigned'}` 
    });
  };

  const confirmReactivation = () => {
    if (reactivateConfirm) {
      performAssignmentUpdate(reactivateConfirm.opp, reactivateConfirm.assignee, true);
      setReactivateConfirm(null);
    }
  };

  return (
    <AppLayout
      onNewApplication={() => setShowNewModal(true)}
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Page title */}
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Opportunities</h1>
        {/* Stats - Compact header-style badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="h-7 px-3 text-sm font-medium gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />Active {stats.total}
            </Badge>
            <Badge variant="outline" className="h-7 px-3 text-sm font-medium gap-1.5 border-blue-500/30 text-blue-500">
              <Plus className="h-3.5 w-3.5" />New {stats.new}
            </Badge>
            <Badge variant="outline" className="h-7 px-3 text-sm font-medium gap-1.5 border-amber-500/30 text-amber-500">
              <AlertCircle className="h-3.5 w-3.5" />In Progress {stats.inProgress}
            </Badge>
            <Badge variant="outline" className="h-7 px-3 text-sm font-medium gap-1.5 border-emerald-500/30 text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" />Won {stats.won}
            </Badge>
            <Badge variant="outline" className="h-7 px-3 text-sm font-medium gap-1.5 border-destructive/30 text-destructive">
              <XCircle className="h-3.5 w-3.5" />Closed {stats.lost}
            </Badge>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="dead">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-[160px] h-10">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">All Stages</SelectItem>
                    {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue placeholder="Owner" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">All Owners</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {TEAM_MEMBERS.map(member => (
                      <SelectItem key={member} value={member}>{member}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue placeholder="Pipeline" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">All Pipelines</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="gateway_only">Gateway</SelectItem>
                  </SelectContent>
                </Select>

              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {filteredOpportunities.length} Opportunities
                </CardTitle>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'cards')}>
                  <TabsList className="h-9">
                    <TabsTrigger value="table" className="text-sm px-4">Table</TabsTrigger>
                    <TabsTrigger value="cards" className="text-sm px-4">Cards</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : viewMode === 'table' ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <SortableTableHead field="name" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Account</SortableTableHead>
                        <SortableTableHead field="stage" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Stage</SortableTableHead>
                        <SortableTableHead field="pipeline" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Pipeline</SortableTableHead>
                        <SortableTableHead field="owner" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Owner</SortableTableHead>
                        <SortableTableHead field="tasks" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Tasks</SortableTableHead>
                        <SortableTableHead field="progress" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Progress</SortableTableHead>
                        <SortableTableHead field="created" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Created</SortableTableHead>
                        <SortableTableHead field="updated" currentSortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Updated</SortableTableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOpportunities.map((opp, index) => {
                        const stageConfig = STAGE_CONFIG[opp.stage as OpportunityStage];
                        const serviceType = getServiceType(opp);
                        const taskCount = getTaskCount(opp.id);
                        const progress = opp.wizard_state?.progress || 0;
                        
                        return (
                          <TableRow 
                            key={opp.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigateToOpportunity(opp)}
                          >
                            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-base">{opp.account?.name || 'Unknown'}</p>
                                    {opp.status === 'dead' && (
                                      <Badge variant="outline" className="text-xs h-5 px-1.5 border-amber-500/50 text-amber-600 dark:text-amber-400 gap-1">
                                        <RotateCcw className="h-2.5 w-2.5" />
                                        Assign to reactivate
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {opp.contact?.email || '-'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={opp.stage}
                                onValueChange={async (value) => {
                                  const newStage = value as OpportunityStage;
                                  const oldStage = opp.stage;

                                  const { error } = await supabase
                                    .from('opportunities')
                                    .update({ stage: newStage })
                                    .eq('id', opp.id);

                                  if (error) {
                                    toast({ title: "Failed to update stage", variant: "destructive" });
                                    return;
                                  }

                                  // Log activity
                                  await supabase.from('activities').insert({
                                    opportunity_id: opp.id,
                                    type: 'stage_change',
                                    description: `Moved from ${STAGE_CONFIG[oldStage as OpportunityStage].label} to ${STAGE_CONFIG[newStage].label}`,
                                    user_id: user?.id,
                                    user_email: user?.email,
                                  });

                                  // Send email notification
                                  if (opp.assigned_to) {
                                    sendStageChangeEmail(
                                      opp.assigned_to,
                                      opp.account?.name || 'Unknown Account',
                                      oldStage,
                                      newStage,
                                      user?.email
                                    ).catch(err => console.error("Failed to send stage change email:", err));
                                  }

                                  toast({ title: `Stage updated to ${STAGE_CONFIG[newStage].label}` });
                                }}
                              >
                                <SelectTrigger className="h-8 w-auto min-w-[100px] border-0 bg-transparent hover:bg-muted/50 px-2 text-sm gap-1.5">
                                  <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: stageConfig?.color }}
                                  />
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover z-50">
                                  {(serviceType === 'gateway_only' ? GATEWAY_ONLY_PIPELINE_STAGES : PROCESSING_PIPELINE_STAGES).map((stage) => (
                                    <SelectItem key={stage} value={stage} className="text-sm">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: STAGE_CONFIG[stage].color }}
                                        />
                                        {STAGE_CONFIG[stage].label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {serviceType === 'gateway_only' ? (
                                  <>
                                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                                    <span className="text-sm">Gateway</span>
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                                    <span className="text-sm">Processing</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={opp.assigned_to || 'unassigned'}
                                onValueChange={(value) => handleAssignmentChange(opp, value)}
                              >
                                <SelectTrigger className="h-8 w-auto min-w-[100px] border-0 bg-transparent hover:bg-muted/50 px-2 text-sm gap-1.5">
                                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover z-50">
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {TEAM_MEMBERS.map(member => (
                                    <SelectItem key={member} value={member}>{member}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {taskCount > 0 && (
                                <Badge variant="secondary" className="text-sm">
                                  {taskCount} open
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      progress >= 100 ? "bg-emerald-500" : progress >= 50 ? "bg-amber-500" : "bg-primary"
                                    )}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground">{progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(new Date(opp.created_at), 'MMM d, yyyy')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDistanceToNow(new Date(opp.updated_at), { addSuffix: true })}
                              </div>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover">
                                  <DropdownMenuItem onClick={() => navigateToOpportunity(opp)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredOpportunities.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No opportunities found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredOpportunities.map(opp => {
                    const stageConfig = STAGE_CONFIG[opp.stage as OpportunityStage];
                    const serviceType = getServiceType(opp);
                    const progress = opp.wizard_state?.progress || 0;

                    return (
                      <Card
                        key={opp.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigateToOpportunity(opp)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-medium text-base">{opp.account?.name || 'Unknown'}</h3>
                              <p className="text-sm text-muted-foreground">{opp.contact?.email}</p>
                              {opp.status === 'dead' && (
                                <Badge variant="outline" className="mt-2 text-xs h-5 px-1.5 border-amber-500/50 text-amber-600 dark:text-amber-400 gap-1">
                                  <RotateCcw className="h-2.5 w-2.5" />
                                  Assign to reactivate
                                </Badge>
                              )}
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={opp.stage}
                                onValueChange={async (value) => {
                                  const newStage = value as OpportunityStage;
                                  const oldStage = opp.stage;

                                  const { error } = await supabase
                                    .from('opportunities')
                                    .update({ stage: newStage })
                                    .eq('id', opp.id);

                                  if (error) {
                                    toast({ title: "Failed to update stage", variant: "destructive" });
                                    return;
                                  }

                                  await supabase.from('activities').insert({
                                    opportunity_id: opp.id,
                                    type: 'stage_change',
                                    description: `Moved from ${STAGE_CONFIG[oldStage as OpportunityStage].label} to ${STAGE_CONFIG[newStage].label}`,
                                    user_id: user?.id,
                                    user_email: user?.email,
                                  });

                                  if (opp.assigned_to) {
                                    sendStageChangeEmail(
                                      opp.assigned_to,
                                      opp.account?.name || 'Unknown Account',
                                      oldStage,
                                      newStage,
                                      user?.email
                                    ).catch(err => console.error("Failed to send stage change email:", err));
                                  }

                                  toast({ title: `Stage updated to ${STAGE_CONFIG[newStage].label}` });
                                }}
                              >
                                <SelectTrigger className="h-8 w-auto border-0 bg-transparent hover:bg-muted/50 px-2 text-sm gap-1.5">
                                  <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: stageConfig?.color }}
                                  />
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover z-50">
                                  {(serviceType === 'gateway_only' ? GATEWAY_ONLY_PIPELINE_STAGES : PROCESSING_PIPELINE_STAGES).map((stage) => (
                                    <SelectItem key={stage} value={stage} className="text-sm">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: STAGE_CONFIG[stage].color }}
                                        />
                                        {STAGE_CONFIG[stage].label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                              <span className="text-muted-foreground">Owner</span>
                              <Select
                                value={opp.assigned_to || 'unassigned'}
                                onValueChange={(value) => handleAssignmentChange(opp, value)}
                              >
                                <SelectTrigger className="h-7 w-auto border-0 bg-transparent hover:bg-muted/50 px-2 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover z-50">
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {TEAM_MEMBERS.map(member => (
                                    <SelectItem key={member} value={member}>{member}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Pipeline</span>
                              <div className="flex items-center gap-1.5">
                                {serviceType === 'gateway_only' ? (
                                  <><Zap className="h-3.5 w-3.5 text-amber-500" />Gateway</>
                                ) : (
                                  <><CreditCard className="h-3.5 w-3.5 text-blue-500" />Processing</>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  progress >= 100 ? "bg-emerald-500" : progress >= 50 ? "bg-amber-500" : "bg-primary"
                                )}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                            Updated {formatDistanceToNow(new Date(opp.updated_at), { addSuffix: true })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* New Application Modal */}
        <NewApplicationModal
          open={showNewModal}
          onClose={() => setShowNewModal(false)}
          onSubmit={fetchOpportunities}
        />

        {/* Reactivation Confirmation Dialog */}
        <AlertDialog open={!!reactivateConfirm} onOpenChange={(open) => !open && setReactivateConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-amber-500" />
                Reactivate Archived Opportunity?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This opportunity is currently archived. Assigning it to <span className="font-medium text-foreground">{reactivateConfirm?.assignee}</span> will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Reactivate the opportunity</li>
                  <li>Move it back to the pipeline</li>
                  <li>Assign it to {reactivateConfirm?.assignee}</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmReactivation}>
                Reactivate & Assign
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </AppLayout>
  );
};

export default Opportunities;
