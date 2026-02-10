import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Zap, CreditCard, Users, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import { getServiceType, TEAM_MEMBERS } from "@/types/opportunity";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const TEAM_EMAIL_MAP: Record<string, string> = {
  'Wesley': 'dylan@merchanthaus.io',
  'Jamie': 'admin@merchanthaus.io',
  'Darryn': 'darryn@merchanthaus.io',
  'Taryn': 'taryn@merchanthaus.io',
  'Yaseen': 'support@merchanthaus.io',
  'Sales': 'sales@merchanthaus.io',
};

const LiveBilling = () => {
  const [search, setSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterPipeline, setFilterPipeline] = useState<string>("all");
  const isMobile = useIsMobile();

  const { data: liveOpportunities, isLoading } = useQuery({
    queryKey: ["live-billing-opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select(`
          *,
          account:accounts(*),
          contact:contacts(*)
        `)
        .eq("stage", "live_activated")
        .eq("status", "active")
        .order("stage_entered_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: avatars } = useQuery({
    queryKey: ["team-avatars"],
    queryFn: async () => {
      const emails = Object.values(TEAM_EMAIL_MAP);
      const { data } = await supabase
        .from("profiles")
        .select("email, avatar_url")
        .in("email", emails);
      const map: Record<string, string> = {};
      data?.forEach((p) => {
        if (p.email && p.avatar_url) map[p.email] = p.avatar_url;
      });
      return map;
    },
  });

  const filtered = useMemo(() => {
    if (!liveOpportunities) return [];
    return liveOpportunities.filter((opp) => {
      const name = (opp.account as any)?.name?.toLowerCase() || "";
      const contactName = `${(opp.contact as any)?.first_name || ""} ${(opp.contact as any)?.last_name || ""}`.toLowerCase();
      const q = search.toLowerCase();
      const matchSearch = !q || name.includes(q) || contactName.includes(q);
      const matchAssignee = filterAssignee === "all" || opp.assigned_to === filterAssignee;
      const svcType = getServiceType(opp as any);
      const matchPipeline = filterPipeline === "all" || svcType === filterPipeline;
      return matchSearch && matchAssignee && matchPipeline;
    });
  }, [liveOpportunities, search, filterAssignee, filterPipeline]);

  const stats = useMemo(() => {
    const total = liveOpportunities?.length || 0;
    const processing = liveOpportunities?.filter((o) => getServiceType(o as any) === "processing").length || 0;
    const gateway = total - processing;
    const assignees = new Set(liveOpportunities?.map((o) => o.assigned_to).filter(Boolean));
    return { total, processing, gateway, teamMembers: assignees.size };
  }, [liveOpportunities]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <AppLayout pageTitle="Live & Billing">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <Card className="border-amber-400/40 dark:border-amber-500/30 bg-gradient-to-br from-amber-50/80 to-yellow-50/60 dark:from-amber-950/30 dark:to-yellow-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Live</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.processing}</p>
                <p className="text-xs text-muted-foreground">Processing</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.gateway}</p>
                <p className="text-xs text-muted-foreground">Gateway</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.teamMembers}</p>
                <p className="text-xs text-muted-foreground">Team Active</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by account or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {TEAM_MEMBERS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPipeline} onValueChange={setFilterPipeline}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Pipeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pipelines</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="gateway_only">Gateway</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No live clients found</p>
            </CardContent>
          </Card>
        ) : isMobile ? (
          /* Mobile Card View */
          <div className="space-y-3">
            {filtered.map((opp) => {
              const account = opp.account as any;
              const contact = opp.contact as any;
              const svcType = getServiceType(opp as any);
              const assignedEmail = opp.assigned_to ? TEAM_EMAIL_MAP[opp.assigned_to] : null;
              const avatarUrl = assignedEmail && avatars ? avatars[assignedEmail] : null;

              return (
                <Card
                  key={opp.id}
                  className="border-amber-400/30 dark:border-amber-500/20 bg-gradient-to-br from-amber-50/50 to-background dark:from-amber-950/20 dark:to-background"
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {account?.name || "Unknown"}
                      </h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          svcType === "gateway_only"
                            ? "border-teal-500/50 text-teal-600 dark:text-teal-400"
                            : "border-primary/50 text-primary"
                        )}
                      >
                        {svcType === "gateway_only" ? "Gateway" : "Processing"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {contact?.first_name} {contact?.last_name}
                      {contact?.email && ` · ${contact.email}`}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-border/30">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {opp.stage_entered_at
                          ? format(new Date(opp.stage_entered_at), "MMM dd, yyyy")
                          : "—"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {opp.assigned_to && (
                          <>
                            <Avatar className="h-5 w-5 border border-background">
                              {avatarUrl && <AvatarImage src={avatarUrl} />}
                              <AvatarFallback className="text-[8px] bg-muted">
                                {getInitials(opp.assigned_to)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{opp.assigned_to}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Desktop Table View */
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Pipeline</TableHead>
                  <TableHead>Went Live</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((opp) => {
                  const account = opp.account as any;
                  const contact = opp.contact as any;
                  const svcType = getServiceType(opp as any);
                  const assignedEmail = opp.assigned_to ? TEAM_EMAIL_MAP[opp.assigned_to] : null;
                  const avatarUrl = assignedEmail && avatars ? avatars[assignedEmail] : null;

                  return (
                    <TableRow key={opp.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/10">
                      <TableCell className="font-medium">{account?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <div>
                          <span className="text-sm">{contact?.first_name} {contact?.last_name}</span>
                          {contact?.email && (
                            <p className="text-xs text-muted-foreground">{contact.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            svcType === "gateway_only"
                              ? "border-teal-500/50 text-teal-600 dark:text-teal-400"
                              : "border-primary/50 text-primary"
                          )}
                        >
                          {svcType === "gateway_only" ? (
                            <><Zap className="h-3 w-3 mr-1" />Gateway</>
                          ) : (
                            <><CreditCard className="h-3 w-3 mr-1" />Processing</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {opp.stage_entered_at
                            ? format(new Date(opp.stage_entered_at), "MMM dd, yyyy")
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {opp.assigned_to ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-background">
                              {avatarUrl && <AvatarImage src={avatarUrl} />}
                              <AvatarFallback className="text-[9px] bg-muted">
                                {getInitials(opp.assigned_to)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{opp.assigned_to}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default LiveBilling;
