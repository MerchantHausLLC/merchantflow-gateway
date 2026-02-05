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
import type { Tables } from "@/integrations/supabase/types";

type Application = Tables<"applications">;

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
      // 1. Create Account
      const { data: account, error: accountError } = await supabase
        .from("accounts")
        .insert({
          name: app.company_name || app.full_name,
          status: "active",
        })
        .select()
        .single();

      if (accountError) throw accountError;

      // 2. Parse full_name into first/last
      const nameParts = app.full_name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // 3. Create Contact
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

      // 4. Create Opportunity
      const { error: opportunityError } = await supabase
        .from("opportunities")
        .insert({
          account_id: account.id,
          contact_id: contact.id,
          stage: "application_started",
          status: "active",
        });

      if (opportunityError) throw opportunityError;

      // 5. Update Application status
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
                        {app.company_name || "Untitled"}
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>
            {selectedApp && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Company</span>
                    <p className="font-medium">{selectedApp.company_name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contact</span>
                    <p className="font-medium">{selectedApp.full_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email</span>
                    <p className="font-medium">{selectedApp.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone</span>
                    <p className="font-medium">{selectedApp.phone || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Business Type</span>
                    <p className="font-medium">{selectedApp.business_type || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Monthly Volume</span>
                    <p className="font-medium">
                      {selectedApp.monthly_volume
                        ? `$${Number(selectedApp.monthly_volume).toLocaleString()}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted</span>
                    <p className="font-medium">
                      {new Date(selectedApp.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {selectedApp.message && (
                  <div>
                    <span className="text-muted-foreground text-sm">Notes/Message</span>
                    <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                      {selectedApp.message}
                    </p>
                  </div>
                )}
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}