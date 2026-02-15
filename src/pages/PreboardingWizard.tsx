import { useEffect, useMemo, useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from "react";
import { AppLayout } from "@/components/AppLayout";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  ShieldCheck,
  Upload,
  Users
} from "lucide-react";
import { OnboardingWizardState } from "@/types/opportunity";

const PROCESSING_STEPS = [
  "Business Profile",
  "Legal Information",
  "Processing Information",
  "Documents",
  "Review"
] as const;

const GATEWAY_STEPS = [
  "Business Details",
  "Documents & Submit"
] as const;

type SectionKey = "business" | "legal" | "processing" | "documents" | "gateway_business";

// Canonical snake_case required fields matching normalized schema
const REQUIRED_FIELDS: Record<string, string[]> = {
  business: [
    "dba_name",
    "product_description",
    "nature_of_business",
    "dba_contact_first_name",
    "dba_contact_last_name",
    "dba_contact_phone",
    "dba_contact_email",
    "dba_address_line1",
    "dba_city",
    "dba_state",
    "dba_zip"
  ],
  legal: [
    "legal_entity_name",
    "federal_tax_id",
    "ownership_type",
    "business_formation_date",
    "state_incorporated",
    "legal_address_line1",
    "legal_city",
    "legal_state",
    "legal_zip"
  ],
  processing: [
    "monthly_volume",
    "average_transaction",
    "high_ticket",
    "percent_swiped",
    "percent_keyed",
    "percent_moto",
    "percent_ecommerce",
    "percent_b2c",
    "percent_b2b"
  ],
  documents: ["documents"],
  gateway_business: [
    "dba_name", "dba_contact_first_name", "dba_contact_last_name",
    "dba_contact_phone", "dba_contact_email",
    "dba_address_line1", "dba_city", "dba_state", "dba_zip",
    "username", "current_processor"
  ]
};

// Canonical snake_case form interface
interface PreboardingForm {
  // business
  dba_name: string;
  product_description: string;
  nature_of_business: string;
  dba_contact_first_name: string;
  dba_contact_last_name: string;
  dba_contact_phone: string;
  dba_contact_email: string;
  dba_address_line1: string;
  dba_address_line2: string;
  dba_city: string;
  dba_state: string;
  dba_zip: string;

  // legal
  legal_entity_name: string;
  federal_tax_id: string;
  ownership_type: string;
  business_formation_date: string;
  state_incorporated: string;
  legal_address_line1: string;
  legal_address_line2: string;
  legal_city: string;
  legal_state: string;
  legal_zip: string;

  // processing
  monthly_volume: string;
  average_transaction: string;
  high_ticket: string;
  percent_swiped: string;
  percent_keyed: string;
  percent_moto: string;
  percent_ecommerce: string;
  percent_b2c: string;
  percent_b2b: string;
  sic_mcc_code: string;
  website_url: string;

  // gateway-only fields
  username: string;
  current_processor: string;

  // docs
  documents: File[];
  notes: string;
}

const initialState: PreboardingForm = {
  dba_name: "",
  product_description: "",
  nature_of_business: "",
  dba_contact_first_name: "",
  dba_contact_last_name: "",
  dba_contact_phone: "",
  dba_contact_email: "",
  dba_address_line1: "",
  dba_address_line2: "",
  dba_city: "",
  dba_state: "",
  dba_zip: "",
  legal_entity_name: "",
  federal_tax_id: "",
  ownership_type: "",
  business_formation_date: "",
  state_incorporated: "",
  legal_address_line1: "",
  legal_address_line2: "",
  legal_city: "",
  legal_state: "",
  legal_zip: "",
  monthly_volume: "",
  average_transaction: "",
  high_ticket: "",
  percent_swiped: "",
  percent_keyed: "",
  percent_moto: "",
  percent_ecommerce: "",
  percent_b2c: "",
  percent_b2b: "",
  sic_mcc_code: "",
  website_url: "",
  username: "",
  current_processor: "",
  documents: [],
  notes: ""
};


interface OpportunityOption {
  id: string;
  accountName: string;
  stage?: string | null;
  serviceType?: string | null;
}

interface WizardStateRecord extends OnboardingWizardState {
  form_state: Partial<PreboardingForm>;
}

interface OpportunityWithRelations {
  service_type?: string | null;
  account?: {
    name?: string;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
    website?: string | null;
  } | null;
  contact?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    fax?: string | null;
  } | null;
}

const createFormFromOpportunity = (opportunity?: OpportunityWithRelations | null): PreboardingForm => {
  const account = opportunity?.account;
  const contact = opportunity?.contact;

  return {
    ...initialState,
    dba_name: account?.name || "",
    dba_contact_first_name: contact?.first_name || "",
    dba_contact_last_name: contact?.last_name || "",
    dba_contact_phone: contact?.phone || "",
    dba_contact_email: contact?.email || "",
    dba_address_line1: account?.address1 || "",
    dba_address_line2: account?.address2 || "",
    dba_city: account?.city || "",
    dba_state: account?.state || "",
    dba_zip: account?.zip || "",
    website_url: account?.website || "",
    legal_entity_name: account?.name || "",
    legal_address_line1: account?.address1 || "",
    legal_address_line2: account?.address2 || "",
    legal_city: account?.city || "",
    legal_state: account?.state || "",
    legal_zip: account?.zip || "",
  };
};

const wizardStatusClasses = (value: number) => {
  if (value >= 100) return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/40";
  if (value >= 10) return "bg-amber-500/10 text-amber-400 border border-amber-500/40";
  return "bg-destructive/10 text-destructive border border-destructive/40";
};

export default function PreboardingWizard() {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [form, setForm] = useState<PreboardingForm>(initialState);
  const [opportunityOptions, setOpportunityOptions] = useState<OpportunityOption[]>([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [isGatewayOnly, setIsGatewayOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const steps = isGatewayOnly ? GATEWAY_STEPS : PROCESSING_STEPS;

  useEffect(() => {
    fetchOpportunities();
    const initialOpportunityId = searchParams.get("opportunityId");
    if (initialOpportunityId) {
      setSelectedOpportunityId(initialOpportunityId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedOpportunityId) {
      loadWizardState(selectedOpportunityId);
    } else {
      setForm(initialState);
      setStepIndex(0);
    }
  }, [selectedOpportunityId]);

  const fetchOpportunities = async () => {
    const { data, error } = await supabase
      .from('opportunities')
      .select(`id, stage, account:accounts(id, name)`)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Could not load accounts", description: error.message, variant: "destructive" });
      return;
    }

    const ids = (data || []).map(d => d.id);
    const { data: serviceTypes } = ids.length > 0
      ? await supabase.from('opportunities').select('id, service_type').in('id', ids)
      : { data: [] as any[] };
    const serviceTypeMap = new Map((serviceTypes || []).map((s: any) => [s.id, s.service_type]));

    const mapped = (data || []).map(item => ({
      id: item.id,
      accountName: item.account?.name ?? "Unknown account",
      stage: item.stage,
      serviceType: serviceTypeMap.get(item.id) || null
    }));

    setOpportunityOptions(mapped);
  };

  const loadWizardState = async (opportunityId: string) => {
    setIsLoadingState(true);
    const { data: opportunity, error: opportunityError } = await supabase
      .from('opportunities')
      .select(`
        id,
        account:accounts(name, address1, address2, city, state, zip, country, website),
        contact:contacts(first_name, last_name, email, phone, fax)
      `)
      .eq('id', opportunityId)
      .single();

    if (opportunityError && opportunityError.code !== "PGRST116") {
      toast({ title: "Could not load account", description: opportunityError.message, variant: "destructive" });
    }

    const { data: oppServiceType } = await supabase
      .from('opportunities')
      .select('service_type')
      .eq('id', opportunityId)
      .single();

    const gatewayOnly = (oppServiceType as any)?.service_type === "gateway_only";
    setIsGatewayOnly(gatewayOnly);

    const prefilledForm = createFormFromOpportunity(opportunity);
    const { data, error } = await supabase
      .from('onboarding_wizard_states')
      .select('id, opportunity_id, progress, step_index, form_state, created_at, updated_at')
      .eq('opportunity_id', opportunityId)
      .single<WizardStateRecord>();

    if (error && error.code !== "PGRST116") {
      toast({ title: "Could not load wizard state", description: error.message, variant: "destructive" });
      setIsLoadingState(false);
      return;
    }

    if (data) {
      const restoredForm: PreboardingForm = {
        ...prefilledForm,
        ...(data.form_state as Partial<PreboardingForm>),
        documents: []
      };
      setForm(restoredForm);
      setStepIndex(data.step_index ?? 0);
    } else {
      setForm(prefilledForm);
      setStepIndex(0);
    }

    setIsLoadingState(false);
  };

  const handleChange = <K extends keyof PreboardingForm>(field: K, value: PreboardingForm[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDocsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setForm(prev => ({ ...prev, documents: files }));
  };

  const getMissingFieldsForSection = (sectionKey: string) => {
    const required = REQUIRED_FIELDS[sectionKey] ?? [];
    if (sectionKey === "documents") {
      return form.documents.length > 0 ? [] : ["At least one supporting document"];
    }
    return required.filter(field => !String(form[field as keyof PreboardingForm] ?? "").trim());
  };

  const missingBySection = useMemo(() => {
    if (isGatewayOnly) {
      return {
        gateway_business: getMissingFieldsForSection("gateway_business"),
        documents: getMissingFieldsForSection("documents"),
      };
    }
    return {
      business: getMissingFieldsForSection("business"),
      legal: getMissingFieldsForSection("legal"),
      processing: getMissingFieldsForSection("processing"),
      documents: getMissingFieldsForSection("documents"),
    };
  }, [form, isGatewayOnly]);

  const totalRequiredFields = useMemo(() => {
    if (isGatewayOnly) {
      return REQUIRED_FIELDS.gateway_business.length + 1;
    }
    return REQUIRED_FIELDS.business.length + REQUIRED_FIELDS.legal.length + REQUIRED_FIELDS.processing.length + 1;
  }, [isGatewayOnly]);

  const completedRequiredFields = useMemo(() => {
    if (isGatewayOnly) {
      const gwMissing = missingBySection.gateway_business?.length ?? 0;
      return (REQUIRED_FIELDS.gateway_business.length - gwMissing) +
        ((missingBySection.documents?.length ?? 1) === 0 ? 1 : 0);
    }
    return (
      (REQUIRED_FIELDS.business.length - (missingBySection.business?.length ?? 0)) +
      (REQUIRED_FIELDS.legal.length - (missingBySection.legal?.length ?? 0)) +
      (REQUIRED_FIELDS.processing.length - (missingBySection.processing?.length ?? 0)) +
      ((missingBySection.documents?.length ?? 1) === 0 ? 1 : 0)
    );
  }, [missingBySection, isGatewayOnly]);

  const progress = Math.round((completedRequiredFields / totalRequiredFields) * 100);

  const saveWizardState = async () => {
    if (!selectedOpportunityId) {
      toast({
        title: "Select an account",
        description: "Attach the wizard to an account before saving progress.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    const { documents: _docs, ...restForm } = form;
    const serializableForm: Partial<PreboardingForm> = { ...restForm, documents: [] };

    const { error } = await supabase
      .from('onboarding_wizard_states')
      .upsert({
        opportunity_id: selectedOpportunityId,
        progress,
        step_index: stepIndex,
        form_state: serializableForm as unknown
      } as never, { onConflict: 'opportunity_id' });

    if (error) {
      toast({ title: "Could not save wizard", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Wizard saved", description: "Progress is now available on the account card." });
    }

    setIsSaving(false);
  };

  const handleSubmit = async () => {
    await saveWizardState();
    console.log("Preboarding payload", form);
    alert("Preboarding checklist complete! You can now move to the formal merchant app.");
  };

  const currentStep = steps[stepIndex];

  return (
    <AppLayout
      pageTitle="Preboarding Wizard"
      headerActions={
        <span className="text-xs text-muted-foreground">Step {stepIndex + 1} of {steps.length}</span>
      }
    >
      <div className="p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Use this preboarding checklist before the formal application.</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-48 rounded-full bg-merchant-gray overflow-hidden">
                      <div className="h-full bg-merchant-redLight transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-white">{progress}% complete</span>
                  </div>
                  {selectedOpportunityId && (
                    <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs", wizardStatusClasses(progress))}>
                      <span className="h-2 w-2 rounded-full bg-current" />
                      <span>Attached to dashboard account • {progress}%</span>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-merchant-gray bg-merchant-dark px-4 py-3 shadow-xl w-full md:w-[360px] space-y-2">
                  <div className="flex items-center justify-between text-sm text-white">
                    <span>Attach to dashboard account</span>
                    {isLoadingState && <span className="text-xs text-gray-400">Loading…</span>}
                  </div>
                  <select
                    value={selectedOpportunityId ?? ""}
                    onChange={event => setSelectedOpportunityId(event.target.value || null)}
                    className="w-full rounded-xl border border-merchant-gray bg-merchant-black px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-merchant-red"
                  >
                    <option value="">Select an account to sync</option>
                    {opportunityOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.accountName} {option.stage ? `• ${option.stage.replace(/_/g, ' ')}` : ""}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                    <span>Saving links the wizard to the application card.</span>
                    <button
                      type="button"
                      className="ml-auto rounded-lg bg-merchant-red px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                      onClick={saveWizardState}
                      disabled={!selectedOpportunityId || isSaving}
                    >
                      {isSaving ? "Saving..." : "Save wizard state"}
                    </button>
                  </div>
                </div>
              </div>

              <ol className="flex flex-wrap gap-2 text-xs font-medium text-gray-400">
                {steps.map((label, index) => (
                  <li
                    key={label}
                    onClick={() => setStepIndex(index)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1 cursor-pointer transition-colors hover:bg-merchant-gray/30",
                      index === stepIndex
                        ? "border-merchant-redLight/70 bg-merchant-red/10 text-white"
                        : index < stepIndex
                          ? "border-merchant-gray bg-merchant-gray/20 text-white"
                          : "border-merchant-gray text-gray-400"
                    )}
                  >
                    <span className="h-5 w-5 rounded-full border border-merchant-gray text-center text-[11px] leading-5">
                      {index + 1}
                    </span>
                    <span>{label}</span>
                  </li>
                ))}
              </ol>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
                <section className="space-y-4 rounded-2xl border border-merchant-gray bg-merchant-dark p-5 shadow-xl">
                  {currentStep === "Business Profile" && (
                    <BusinessProfileStep form={form} onChange={handleChange} />
                  )}
                  {currentStep === "Legal Information" && (
                    <LegalInfoStep form={form} onChange={handleChange} />
                  )}
                  {currentStep === "Processing Information" && (
                    <ProcessingStep form={form} onChange={handleChange} />
                  )}
                  {(currentStep === "Documents" || currentStep === "Documents & Submit") && (
                    <DocumentsStep form={form} onChange={handleChange} onDocsChange={handleDocsChange} />
                  )}
                  {currentStep === "Review" && (
                    <ReviewStep form={form} missingBySection={missingBySection as any} />
                  )}
                  {currentStep === "Business Details" && (
                    <GatewayBusinessStep form={form} onChange={handleChange} />
                  )}

                  <div className="mt-6 flex items-center justify-between border-t border-merchant-gray/60 pt-4">
                    <button
                      type="button"
                      className="rounded-xl border border-merchant-gray px-4 py-2 text-sm font-medium text-gray-200 hover:bg-merchant-gray/40 disabled:opacity-40"
                      onClick={() => setStepIndex(prev => Math.max(0, prev - 1))}
                      disabled={stepIndex === 0}
                    >
                      ← Back
                    </button>

                    {stepIndex < steps.length - 1 ? (
                      <button
                        type="button"
                        className="rounded-xl bg-merchant-red px-4 py-2 text-sm font-semibold text-white shadow hover:bg-merchant-redLight"
                        onClick={() => setStepIndex(prev => Math.min(steps.length - 1, prev + 1))}
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="rounded-xl bg-merchant-red px-4 py-2 text-sm font-semibold text-white shadow hover:bg-merchant-redLight disabled:bg-merchant-gray disabled:text-gray-500"
                        onClick={handleSubmit}
                        disabled={progress < 100}
                      >
                        Mark Preboarding Complete
                      </button>
                    )}
                  </div>
                </section>

                <aside className="space-y-4">
                  <div className="rounded-2xl border border-merchant-gray bg-merchant-dark p-4 shadow-xl">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <ShieldCheck className="w-4 h-4 text-merchant-redLight" />
                      Status snapshot
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Move to the formal merchant application when this hits 100%.
                    </p>

                    <div className="mt-3 space-y-3 text-xs">
                      {isGatewayOnly ? (
                        <>
                          <SectionStatus
                            label="Business details"
                            done={(missingBySection.gateway_business?.length ?? 0) === 0}
                            count={REQUIRED_FIELDS.gateway_business.length - (missingBySection.gateway_business?.length ?? 0)}
                            total={REQUIRED_FIELDS.gateway_business.length}
                          />
                          <SectionStatus
                            label="Documents"
                            done={(missingBySection.documents?.length ?? 0) === 0}
                            count={(missingBySection.documents?.length ?? 1) === 0 ? 1 : 0}
                            total={1}
                          />
                        </>
                      ) : (
                        <>
                          <SectionStatus
                            label="Business profile"
                            done={(missingBySection.business?.length ?? 0) === 0}
                            count={REQUIRED_FIELDS.business.length - (missingBySection.business?.length ?? 0)}
                            total={REQUIRED_FIELDS.business.length}
                          />
                          <SectionStatus
                            label="Legal info"
                            done={(missingBySection.legal?.length ?? 0) === 0}
                            count={REQUIRED_FIELDS.legal.length - (missingBySection.legal?.length ?? 0)}
                            total={REQUIRED_FIELDS.legal.length}
                          />
                          <SectionStatus
                            label="Processing"
                            done={(missingBySection.processing?.length ?? 0) === 0}
                            count={REQUIRED_FIELDS.processing.length - (missingBySection.processing?.length ?? 0)}
                            total={REQUIRED_FIELDS.processing.length}
                          />
                          <SectionStatus
                            label="Documents"
                            done={(missingBySection.documents?.length ?? 0) === 0}
                            count={(missingBySection.documents?.length ?? 1) === 0 ? 1 : 0}
                            total={1}
                          />
                        </>
                      )}
                    </div>

                    <OutstandingSummary progress={progress} missingBySection={missingBySection as any} />
                  </div>

                  <div className="rounded-2xl border border-merchant-gray bg-merchant-dark p-4 shadow-xl text-xs text-gray-300 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <FileText className="w-4 h-4 text-merchant-redLight" />
                      Quick tips
                    </div>
                    <ul className="list-disc space-y-1 pl-4">
                      <li>Use this to collect everything before touching the full app.</li>
                      <li>Docs can be bank statements, voided checks, IDs, or processing reports.</li>
                      <li>Share the payload with underwriting or export it into the formal boarding flow.</li>
                    </ul>
                  </div>
                </aside>
              </div>
            </div>
      </div>
    </AppLayout>
  );
}

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: ReactNode; hint?: string; }) {
  return (
    <label className="space-y-1 text-sm text-gray-200">
      <span className="flex items-center gap-1 font-medium text-white">
        {label}
        {required && <span className="text-merchant-redLight">*</span>}
      </span>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </label>
  );
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-merchant-gray bg-merchant-black px-3 py-2 text-sm text-white shadow-sm focus:border-merchant-red focus:outline-none focus:ring-2 focus:ring-merchant-red/40",
        props.className
      )}
    />
  );
}

function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input type="number" step="any" min="0" {...props} />;
}

function SectionStatus({ label, done, count, total }: { label: string; done: boolean; count: number; total: number; }) {
  const pct = Math.round((count / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-200">{label}</span>
        <span className="text-[11px] text-gray-400">
          {count}/{total} · {pct}% {done ? "✓" : ""}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-merchant-gray/60">
        <div
          className={cn("h-full", done ? "bg-merchant-redLight" : "bg-merchant-red/70")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OutstandingSummary({ progress, missingBySection }: { progress: number; missingBySection: Record<string, string[]>; }) {
  return (
    <div className="mt-4 rounded-2xl border border-merchant-gray bg-merchant-black p-4 text-sm">
      <div className="mb-2 flex items-center gap-2 font-semibold text-white">
        <BadgeCheck className="w-4 h-4 text-merchant-redLight" />
        Outstanding items
      </div>
      {progress === 100 ? (
        <p className="text-emerald-400">All required items are captured. 🎉</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-gray-300">
          {Object.entries(missingBySection).map(([section, fields]) =>
            fields.length ? (
              <li key={section}>
                <span className="font-medium capitalize text-white">{section.replace(/_/g, " ")}:</span> {fields.join(", ")}
              </li>
            ) : null
          )}
        </ul>
      )}
    </div>
  );
}

function GatewayBusinessStep({ form, onChange }: { form: PreboardingForm; onChange: <K extends keyof PreboardingForm>(field: K, value: PreboardingForm[K]) => void; }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Users className="w-4 h-4 text-merchant-redLight" />
        Gateway Business Details
      </div>
      <p className="text-xs text-gray-400">
        Simplified form for gateway-only accounts. Provide business and contact details plus your preferred NMI username.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="DBA Name" required>
          <Input value={form.dba_name} onChange={e => onChange("dba_name", e.target.value)} />
        </Field>
        <Field label="Current Processor" required>
          <Input value={form.current_processor} onChange={e => onChange("current_processor", e.target.value)} placeholder="e.g. Stripe, Square" />
        </Field>
        <Field label="Preferred NMI Username" required>
          <Input value={form.username} onChange={e => onChange("username", e.target.value)} placeholder="Desired NMI login username" />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Contact First Name" required>
          <Input value={form.dba_contact_first_name} onChange={e => onChange("dba_contact_first_name", e.target.value)} />
        </Field>
        <Field label="Contact Last Name" required>
          <Input value={form.dba_contact_last_name} onChange={e => onChange("dba_contact_last_name", e.target.value)} />
        </Field>
        <Field label="Phone" required>
          <Input value={form.dba_contact_phone} onChange={e => onChange("dba_contact_phone", e.target.value)} placeholder="+1 (555) 555-5555" />
        </Field>
        <Field label="Email" required>
          <Input type="email" value={form.dba_contact_email} onChange={e => onChange("dba_contact_email", e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Address" required>
          <Input value={form.dba_address_line1} onChange={e => onChange("dba_address_line1", e.target.value)} />
        </Field>
        <Field label="Address Line 2">
          <Input value={form.dba_address_line2} onChange={e => onChange("dba_address_line2", e.target.value)} />
        </Field>
        <Field label="City" required>
          <Input value={form.dba_city} onChange={e => onChange("dba_city", e.target.value)} />
        </Field>
        <Field label="State / Province" required>
          <Input value={form.dba_state} onChange={e => onChange("dba_state", e.target.value)} />
        </Field>
        <Field label="ZIP / Postal" required>
          <Input value={form.dba_zip} onChange={e => onChange("dba_zip", e.target.value)} />
        </Field>
      </div>
      <Field label="Notes" hint="Any additional details (voided check instructions, VAR sheet, etc.)">
        <Input value={form.notes} onChange={e => onChange("notes", e.target.value)} />
      </Field>
    </div>
  );
}

function BusinessProfileStep({ form, onChange }: { form: PreboardingForm; onChange: <K extends keyof PreboardingForm>(field: K, value: PreboardingForm[K]) => void; }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Users className="w-4 h-4 text-merchant-redLight" />
        Business Profile
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="DBA name (doing business as)" required>
          <Input value={form.dba_name} onChange={e => onChange("dba_name", e.target.value)} />
        </Field>
        <Field label="Describe products / services" required>
          <Input value={form.product_description} onChange={e => onChange("product_description", e.target.value)} />
        </Field>
        <Field label="Nature of business" required>
          <Input value={form.nature_of_business} onChange={e => onChange("nature_of_business", e.target.value)} placeholder="e.g. Retail, eCommerce, Medical" />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="DBA contact first name" required>
          <Input value={form.dba_contact_first_name} onChange={e => onChange("dba_contact_first_name", e.target.value)} />
        </Field>
        <Field label="DBA contact last name" required>
          <Input value={form.dba_contact_last_name} onChange={e => onChange("dba_contact_last_name", e.target.value)} />
        </Field>
        <Field label="DBA contact phone" required>
          <Input value={form.dba_contact_phone} onChange={e => onChange("dba_contact_phone", e.target.value)} placeholder="+1 (555) 555-5555" />
        </Field>
        <Field label="DBA contact email" required>
          <Input type="email" value={form.dba_contact_email} onChange={e => onChange("dba_contact_email", e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="DBA address" required>
          <Input value={form.dba_address_line1} onChange={e => onChange("dba_address_line1", e.target.value)} />
        </Field>
        <Field label="Address line 2">
          <Input value={form.dba_address_line2} onChange={e => onChange("dba_address_line2", e.target.value)} />
        </Field>
        <Field label="City" required>
          <Input value={form.dba_city} onChange={e => onChange("dba_city", e.target.value)} />
        </Field>
        <Field label="State / Province" required>
          <Input value={form.dba_state} onChange={e => onChange("dba_state", e.target.value)} />
        </Field>
        <Field label="ZIP / Postal" required>
          <Input value={form.dba_zip} onChange={e => onChange("dba_zip", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function LegalInfoStep({ form, onChange }: { form: PreboardingForm; onChange: <K extends keyof PreboardingForm>(field: K, value: PreboardingForm[K]) => void; }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <ShieldCheck className="w-4 h-4 text-merchant-redLight" />
        Legal Information
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Legal entity name" required>
          <Input value={form.legal_entity_name} onChange={e => onChange("legal_entity_name", e.target.value)} />
        </Field>
        <Field label="Federal tax ID (TIN)" required>
          <Input value={form.federal_tax_id} onChange={e => onChange("federal_tax_id", e.target.value)} />
        </Field>
        <Field label="Business / ownership type" required>
          <Input value={form.ownership_type} onChange={e => onChange("ownership_type", e.target.value)} placeholder="e.g. LLC, Sole Prop, Corp" />
        </Field>
        <Field label="Business formation date" required>
          <Input type="date" value={form.business_formation_date} onChange={e => onChange("business_formation_date", e.target.value)} />
        </Field>
        <Field label="State incorporated" required>
          <Input value={form.state_incorporated} onChange={e => onChange("state_incorporated", e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Legal address" required>
          <Input value={form.legal_address_line1} onChange={e => onChange("legal_address_line1", e.target.value)} />
        </Field>
        <Field label="Address line 2">
          <Input value={form.legal_address_line2} onChange={e => onChange("legal_address_line2", e.target.value)} />
        </Field>
        <Field label="City" required>
          <Input value={form.legal_city} onChange={e => onChange("legal_city", e.target.value)} />
        </Field>
        <Field label="State / Province" required>
          <Input value={form.legal_state} onChange={e => onChange("legal_state", e.target.value)} />
        </Field>
        <Field label="ZIP / Postal" required>
          <Input value={form.legal_zip} onChange={e => onChange("legal_zip", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function ProcessingStep({ form, onChange }: { form: PreboardingForm; onChange: <K extends keyof PreboardingForm>(field: K, value: PreboardingForm[K]) => void; }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <CheckCircle2 className="w-4 h-4 text-merchant-redLight" />
        Processing Information
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Monthly volume ($)" required>
          <NumberInput value={form.monthly_volume} onChange={e => onChange("monthly_volume", e.target.value)} />
        </Field>
        <Field label="Average ticket ($)" required>
          <NumberInput value={form.average_transaction} onChange={e => onChange("average_transaction", e.target.value)} />
        </Field>
        <Field label="High ticket ($)" required>
          <NumberInput value={form.high_ticket} onChange={e => onChange("high_ticket", e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Swiped %" required>
          <NumberInput value={form.percent_swiped} onChange={e => onChange("percent_swiped", e.target.value)} />
        </Field>
        <Field label="Keyed %" required>
          <NumberInput value={form.percent_keyed} onChange={e => onChange("percent_keyed", e.target.value)} />
        </Field>
        <Field label="MOTO %" required>
          <NumberInput value={form.percent_moto} onChange={e => onChange("percent_moto", e.target.value)} />
        </Field>
        <Field label="eCommerce %" required>
          <NumberInput value={form.percent_ecommerce} onChange={e => onChange("percent_ecommerce", e.target.value)} />
        </Field>
        <Field label="B2C sales %" required>
          <NumberInput value={form.percent_b2c} onChange={e => onChange("percent_b2c", e.target.value)} />
        </Field>
        <Field label="B2B sales %" required>
          <NumberInput value={form.percent_b2b} onChange={e => onChange("percent_b2b", e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Website">
          <Input value={form.website_url} onChange={e => onChange("website_url", e.target.value)} placeholder="https://" />
        </Field>
        <Field label="SIC / MCC lookup">
          <Input value={form.sic_mcc_code} onChange={e => onChange("sic_mcc_code", e.target.value)} placeholder="Capture MCC if known" />
        </Field>
      </div>
    </div>
  );
}

function DocumentsStep({ form, onChange, onDocsChange }: { form: PreboardingForm; onChange: <K extends keyof PreboardingForm>(field: K, value: PreboardingForm[K]) => void; onDocsChange: (event: ChangeEvent<HTMLInputElement>) => void; }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Upload className="w-4 h-4 text-merchant-redLight" />
        Supporting Documents
      </div>
      <p className="text-xs text-gray-400">
        Upload anything underwriting is likely to ask for: recent bank or processing statements, voided check / bank letter, government ID, etc.
      </p>

      <Field label="Upload documents" required>
        <input
          type="file"
          multiple
          onChange={onDocsChange}
          className="w-full cursor-pointer rounded-lg border border-dashed border-merchant-gray bg-merchant-black px-3 py-8 text-center text-xs text-gray-400"
        />
      </Field>

      {form.documents.length > 0 && (
        <div className="rounded-xl border border-merchant-gray bg-merchant-black p-3 text-xs">
          <div className="mb-1 font-medium text-white">Files selected</div>
          <ul className="list-disc space-y-1 pl-4 text-gray-300">
            {form.documents.map((f, idx) => (
              <li key={`${f.name}-${idx}`} className="truncate">
                {f.name} ({Math.round(f.size / 1024)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}

      <Field label="Internal notes">
        <textarea
          className="min-h-[90px] w-full rounded-lg border border-merchant-gray bg-merchant-black px-3 py-2 text-sm text-white shadow-sm focus:border-merchant-red focus:outline-none focus:ring-2 focus:ring-merchant-red/40"
          value={form.notes}
          onChange={e => onChange("notes", e.target.value)}
          placeholder="Anything unusual about the deal? High ticket rationale, pricing nuances, risk notes, etc."
        />
      </Field>
    </div>
  );
}

function ReviewStep({ form, missingBySection }: { form: PreboardingForm; missingBySection: Record<SectionKey, string[]>; }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <BadgeCheck className="w-4 h-4 text-merchant-redLight" />
        Review & Export
      </div>
      <p className="text-xs text-gray-400">
        Quick snapshot of what you captured. If anything looks off, jump back before moving to the formal portal.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard title="Business Profile">
          <SummaryItem label="DBA name" value={form.dba_name} />
          <SummaryItem label="Products / services" value={form.product_description} />
          <SummaryItem label="Nature of business" value={form.nature_of_business} />
          <SummaryItem label="Contact" value={`${form.dba_contact_first_name} ${form.dba_contact_last_name}`.trim()} />
          <SummaryItem label="Phone" value={form.dba_contact_phone} />
          <SummaryItem label="Email" value={form.dba_contact_email} />
        </SummaryCard>

        <SummaryCard title="Legal Info">
          <SummaryItem label="Legal entity" value={form.legal_entity_name} />
          <SummaryItem label="TIN" value={form.federal_tax_id} />
          <SummaryItem label="Ownership type" value={form.ownership_type} />
          <SummaryItem label="Formation date" value={form.business_formation_date} />
          <SummaryItem label="State incorporated" value={form.state_incorporated} />
        </SummaryCard>

        <SummaryCard title="Processing">
          <SummaryItem label="Monthly volume" value={form.monthly_volume} />
          <SummaryItem label="Avg ticket" value={form.average_transaction} />
          <SummaryItem label="High ticket" value={form.high_ticket} />
          <SummaryItem label="Swiped / Keyed" value={`${form.percent_swiped}% / ${form.percent_keyed}%`} />
          <SummaryItem label="MOTO" value={`${form.percent_moto}%`} />
          <SummaryItem label="eCom" value={`${form.percent_ecommerce}%`} />
          <SummaryItem label="B2C / B2B" value={`${form.percent_b2c}% / ${form.percent_b2b}%`} />
        </SummaryCard>

        <SummaryCard title="Documents & Notes">
          <SummaryItem
            label="Documents"
            value={form.documents.length ? `${form.documents.length} file(s) selected` : "None"}
          />
          <SummaryItem label="Internal notes" value={form.notes || "—"} />
        </SummaryCard>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
        <div className="font-semibold">Reminder</div>
        <p>
          This wizard is for preboarding only. Once it shows 100% complete and all sections look clean, move into the formal merchant application.
        </p>
      </div>

      {Object.values(missingBySection).some(fields => fields.length > 0) && (
        <div className="text-xs text-amber-300">
          Missing fields remain. Complete each section before exporting.
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: ReactNode; }) {
  return (
    <div className="space-y-2 rounded-xl border border-merchant-gray bg-merchant-black p-3 text-xs">
      <div className="font-semibold text-white">{title}</div>
      <dl className="space-y-1">{children}</dl>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string; }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-400">{label}</dt>
      <dd className="flex-1 text-right text-white">{value || "—"}</dd>
    </div>
  );
}
