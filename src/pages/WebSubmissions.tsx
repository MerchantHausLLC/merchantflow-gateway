import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Archive, CheckCircle, ArrowRightCircle, Eye, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Tables } from "@/integrations/supabase/types";

type Application = Tables<"applications">;

const DetailField = ({ label, value }: { label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
};

const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h4 className="text-sm font-semibold text-primary">{title}</h4>
    <div className="grid grid-cols-2 gap-3">
      {children}
    </div>
  </div>
);

export default function WebSubmissions() {
  const [apps, setApps] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isConverting, setIsConverting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching submissions",
        description: error.message,
      });
    } else {
      setApps(data || []);
    }
    setIsLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
    } else {
      toast({ title: "Status updated" });
      fetchApplications();
    }
  };

  const convertToPipeline = async (app: Application) => {
    setIsConverting(app.id);

    try {
      const { data: account, error: accountError } = await supabase
        .from("accounts")
        .insert({
          name: app.company_name || app.full_name,
          status: "active",
          address1: app.address,
          address2: app.address2,
          city: app.city,
          state: app.state,
          zip: app.zip,
          website: app.website,
        })
        .select()
        .single();

      if (accountError) throw accountError;

      const nameParts = app.full_name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          account_id: account.id,
          first_name: firstName,
          last_name: lastName,
          email: app.email,
          phone: app.phone,
        })
        .select()
        .single();

      if (contactError) throw contactError;

      const { error: opportunityError } = await supabase
        .from("opportunities")
        .insert({
          account_id: account.id,
          contact_id: contact.id,
          stage: "application_started",
          status: "active",
        });

      if (opportunityError) throw opportunityError;

      await supabase
        .from("applications")
        .update({ status: "approved" })
        .eq("id", app.id);

      toast({
        title: "Converted to Pipeline",
        description: `Created account, contact, and opportunity for ${app.company_name || app.full_name}`,
      });

      fetchApplications();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Conversion failed",
        description: error.message,
      });
    } finally {
      setIsConverting(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "reviewed":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">Reviewed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <AppLayout pageTitle="Web Submissions">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Incoming Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : apps.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No submissions found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        {new Date(app.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {app.company_name || app.dba_name || "Untitled"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{app.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {app.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {app.monthly_volume
                          ? `$${Number(app.monthly_volume).toLocaleString()}`
                          : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedApp(app)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {app.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus(app.id, "rejected")}
                            >
                              <Archive className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => convertToPipeline(app)}
                              disabled={isConverting === app.id}
                            >
                              {isConverting === app.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <ArrowRightCircle className="h-4 w-4 mr-1" />
                              )}
                              Convert to Pipeline
                            </Button>
                          </>
                        )}
                        {app.status === "approved" && (
                          <Badge className="bg-emerald-500/20 text-emerald-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            In Pipeline
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>
            {selectedApp && (
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-5">
                  {/* Status & Date */}
                  <div className="flex items-center justify-between">
                    {getStatusBadge(selectedApp.status)}
                    <span className="text-xs text-muted-foreground">
                      Submitted {new Date(selectedApp.created_at).toLocaleString()}
                    </span>
                  </div>

                  <Separator />

                  {/* Business Profile */}
                  <DetailSection title="Business Profile">
                    <DetailField label="DBA Name" value={selectedApp.dba_name || selectedApp.company_name} />
                    <DetailField label="Legal Name" value={selectedApp.legal_name} />
                    <DetailField label="Products / Services" value={selectedApp.products} />
                    <DetailField label="Nature of Business" value={selectedApp.nature_of_business} />
                    <DetailField label="Business Type" value={selectedApp.business_type} />
                    <DetailField label="Website" value={selectedApp.website} />
                  </DetailSection>

                  {/* Business Address */}
                  {(selectedApp.address || selectedApp.city) && (
                    <>
                      <Separator />
                      <DetailSection title="Business Address">
                        <DetailField label="Address" value={[selectedApp.address, selectedApp.address2].filter(Boolean).join(", ")} />
                        <DetailField label="City / State / ZIP" value={[selectedApp.city, selectedApp.state, selectedApp.zip].filter(Boolean).join(", ")} />
                      </DetailSection>
                    </>
                  )}

                  <Separator />

                  {/* Contact Information */}
                  <DetailSection title="Contact Information">
                    <DetailField label="Contact Name" value={selectedApp.full_name} />
                    <DetailField label="Email" value={selectedApp.email} />
                    <DetailField label="Phone" value={selectedApp.phone} />
                  </DetailSection>

                  {/* Legal Information */}
                  {(selectedApp.federal_tax_id || selectedApp.business_structure || selectedApp.owner_name) && (
                    <>
                      <Separator />
                      <DetailSection title="Legal Information">
                        <DetailField label="Federal Tax ID (EIN)" value={selectedApp.federal_tax_id} />
                        <DetailField label="State of Incorporation" value={selectedApp.state_of_incorporation} />
                        <DetailField label="Business Structure" value={selectedApp.business_structure} />
                        <DetailField label="Date Established" value={selectedApp.date_established} />
                      </DetailSection>
                    </>
                  )}

                  {/* Owner Information */}
                  {selectedApp.owner_name && (
                    <>
                      <Separator />
                      <DetailSection title="Owner Information">
                        <DetailField label="Owner Name" value={selectedApp.owner_name} />
                        <DetailField label="Title" value={selectedApp.owner_title} />
                        <DetailField label="Date of Birth" value={selectedApp.owner_dob} />
                        <DetailField label="SSN (last 4)" value={selectedApp.owner_ssn_last4 ? `••••${selectedApp.owner_ssn_last4}` : null} />
                        <DetailField label="Home Address" value={selectedApp.owner_address} />
                        <DetailField label="City / State / ZIP" value={[selectedApp.owner_city, selectedApp.owner_state, selectedApp.owner_zip].filter(Boolean).join(", ")} />
                      </DetailSection>
                    </>
                  )}

                  {/* Processing Information */}
                  {(selectedApp.monthly_volume || selectedApp.avg_ticket || selectedApp.current_processor) && (
                    <>
                      <Separator />
                      <DetailSection title="Processing Information">
                        <DetailField label="Monthly Volume" value={selectedApp.monthly_volume ? `$${Number(selectedApp.monthly_volume).toLocaleString()}` : null} />
                        <DetailField label="Avg Ticket" value={selectedApp.avg_ticket ? `$${selectedApp.avg_ticket}` : null} />
                        <DetailField label="High Ticket" value={selectedApp.high_ticket ? `$${selectedApp.high_ticket}` : null} />
                        <DetailField label="Current Processor" value={selectedApp.current_processor} />
                        <DetailField label="Accepted Cards" value={selectedApp.accepted_cards} />
                      </DetailSection>

                      {(selectedApp.ecommerce_percent || selectedApp.in_person_percent || selectedApp.keyed_percent) && (
                        <div className="grid grid-cols-3 gap-3 mt-2">
                          <DetailField label="eCommerce %" value={selectedApp.ecommerce_percent ? `${selectedApp.ecommerce_percent}%` : null} />
                          <DetailField label="In-Person %" value={selectedApp.in_person_percent ? `${selectedApp.in_person_percent}%` : null} />
                          <DetailField label="Keyed %" value={selectedApp.keyed_percent ? `${selectedApp.keyed_percent}%` : null} />
                        </div>
                      )}
                    </>
                  )}

                  {/* Notes */}
                  {(selectedApp.notes || selectedApp.message) && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-xs text-muted-foreground">Notes / Message</span>
                        <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                          {selectedApp.notes || selectedApp.message}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  {selectedApp.status === "pending" && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          updateStatus(selectedApp.id, "rejected");
                          setSelectedApp(null);
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => {
                          convertToPipeline(selectedApp);
                          setSelectedApp(null);
                        }}
                      >
                        <ArrowRightCircle className="h-4 w-4 mr-1" />
                        Convert to Pipeline
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
