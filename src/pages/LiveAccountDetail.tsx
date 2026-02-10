import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Building2,
  User,
  Zap,
  CreditCard,
  Calendar,
  Globe,
  MapPin,
  Mail,
  Phone,
  FileText,
  Activity,
  ExternalLink,
  Briefcase,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { getServiceType, STAGE_CONFIG, migrateStage } from "@/types/opportunity";
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

const InfoRow = ({ icon: Icon, label, value, href }: { icon: any; label: string; value?: string | null; href?: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline break-all">
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-foreground break-all">{value}</p>
        )}
      </div>
    </div>
  );
};

const LiveAccountDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: opportunity, isLoading } = useQuery({
    queryKey: ["live-account-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select(`
          *,
          account:accounts(*),
          contact:contacts(*),
          wizard_state:onboarding_wizard_states(*)
        `)
        .eq("id", id!)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        stage: migrateStage(data.stage),
        wizard_state: Array.isArray(data.wizard_state) ? data.wizard_state[0] : data.wizard_state,
      };
    },
    enabled: !!id,
  });

  const { data: documents } = useQuery({
    queryKey: ["live-account-documents", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("opportunity_id", id!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: activities } = useQuery({
    queryKey: ["live-account-activities", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("activities")
        .select("*")
        .eq("opportunity_id", id!)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: ownerAvatar } = useQuery({
    queryKey: ["owner-avatar", opportunity?.assigned_to],
    queryFn: async () => {
      const email = TEAM_EMAIL_MAP[opportunity!.assigned_to!];
      if (!email) return null;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("email", email)
        .maybeSingle();
      return data;
    },
    enabled: !!opportunity?.assigned_to,
  });

  const account = opportunity?.account as any;
  const contact = opportunity?.contact as any;
  const svcType = opportunity ? getServiceType(opportunity as any) : "processing";

  const getInitials = (name: string) =>
    name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const address = [account?.address1, account?.address2, account?.city, account?.state, account?.zip, account?.country]
    .filter(Boolean)
    .join(", ");

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 lg:p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!opportunity) {
    return (
      <AppLayout>
        <div className="p-4 lg:p-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/live-billing")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Live & Billing
          </Button>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Account not found</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-r from-amber-50/60 via-yellow-50/40 to-background dark:from-amber-950/20 dark:via-yellow-950/10 dark:to-background px-4 lg:px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/live-billing")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl lg:text-2xl font-bold text-foreground truncate">
                    {account?.name || "Unknown Account"}
                  </h1>
                  <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                    ✦ Live
                  </Badge>
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
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                  {opportunity.stage_entered_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Live since {format(new Date(opportunity.stage_entered_at), "MMM dd, yyyy")}
                    </span>
                  )}
                  {opportunity.assigned_to && (
                    <span className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5 border border-background">
                        {ownerAvatar?.avatar_url && <AvatarImage src={ownerAvatar.avatar_url} />}
                        <AvatarFallback className="text-[8px] bg-muted">{getInitials(opportunity.assigned_to)}</AvatarFallback>
                      </Avatar>
                      {opportunity.assigned_to}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/opportunities/${opportunity.id}`)}
              className="shrink-0"
            >
              <Briefcase className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">View Opportunity</span>
              <span className="sm:hidden">Details</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className={cn(
            "grid gap-6",
            isMobile ? "grid-cols-1" : "grid-cols-3"
          )}>
            {/* Account Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                <InfoRow icon={Building2} label="Business Name" value={account?.name} />
                <InfoRow icon={Globe} label="Website" value={account?.website} href={account?.website ? (account.website.startsWith("http") ? account.website : `https://${account.website}`) : undefined} />
                {address && <InfoRow icon={MapPin} label="Address" value={address} />}
                <Separator className="my-2" />
                <div className="py-1">
                  <p className="text-xs text-muted-foreground">Account Status</p>
                  <Badge variant="outline" className="mt-1 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                    Active
                  </Badge>
                </div>
                <div className="py-1">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{account?.created_at ? format(new Date(account.created_at), "MMM dd, yyyy") : "—"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Primary Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                <InfoRow icon={User} label="Full Name" value={[contact?.first_name, contact?.last_name].filter(Boolean).join(" ") || null} />
                <InfoRow icon={Mail} label="Email" value={contact?.email} href={contact?.email ? `mailto:${contact.email}` : undefined} />
                <InfoRow icon={Phone} label="Phone" value={contact?.phone} href={contact?.phone ? `tel:${contact.phone}` : undefined} />
                {contact?.fax && <InfoRow icon={Phone} label="Fax" value={contact.fax} />}
                <Separator className="my-2" />
                {opportunity.referral_source && (
                  <div className="py-1">
                    <p className="text-xs text-muted-foreground">Referral Source</p>
                    <p className="text-sm font-medium">{opportunity.referral_source}</p>
                  </div>
                )}
                {opportunity.username && (
                  <div className="py-1">
                    <p className="text-xs text-muted-foreground">Username</p>
                    <p className="text-sm font-medium">{opportunity.username}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Opportunity Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Opportunity Info
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="py-1">
                  <p className="text-xs text-muted-foreground">Pipeline</p>
                  <p className="text-sm font-medium">{svcType === "gateway_only" ? "NMI Gateway" : "NMI Payments"}</p>
                </div>
                <div className="py-1">
                  <p className="text-xs text-muted-foreground">Stage</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base">{STAGE_CONFIG[opportunity.stage as keyof typeof STAGE_CONFIG]?.icon || "📋"}</span>
                    <p className="text-sm font-medium">{STAGE_CONFIG[opportunity.stage as keyof typeof STAGE_CONFIG]?.label || opportunity.stage}</p>
                  </div>
                </div>
                {opportunity.processing_services && opportunity.processing_services.length > 0 && (
                  <div className="py-1">
                    <p className="text-xs text-muted-foreground mb-1">Processing Services</p>
                    <div className="flex flex-wrap gap-1">
                      {opportunity.processing_services.map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {opportunity.value_services && opportunity.value_services.length > 0 && (
                  <div className="py-1">
                    <p className="text-xs text-muted-foreground mb-1">Value Services</p>
                    <div className="flex flex-wrap gap-1">
                      {opportunity.value_services.map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="py-1">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">{format(new Date(opportunity.created_at), "MMM dd, yyyy")}</p>
                </div>
                <div className="py-1">
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">{formatDistanceToNow(new Date(opportunity.updated_at), { addSuffix: true })}</p>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className={isMobile ? "" : "lg:col-span-2"}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Documents
                  {documents && documents.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] ml-auto">{documents.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {!documents || documents.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No documents uploaded</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.document_type || "Unassigned"} · {doc.created_at ? format(new Date(doc.created_at), "MMM dd") : ""}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" asChild>
                          <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {!activities || activities.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No activity recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((act) => (
                      <div key={act.id} className="flex gap-3 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-2 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-foreground">{act.description || act.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default LiveAccountDetail;
