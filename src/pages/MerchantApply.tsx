import { useMemo, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Scale,
  CreditCard,
  CheckCircle2,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

const STEPS = [
  { label: "Business Profile", icon: Building2 },
  { label: "Legal Information", icon: Scale },
  { label: "Processing Info", icon: CreditCard },
  { label: "Application Readiness", icon: CheckCircle2 }
] as const;

type SectionKey = "business" | "legal" | "processing";

const REQUIRED_FIELDS: Record<SectionKey, string[]> = {
  business: [
    "dbaName",
    "products",
    "natureOfBusiness",
    "contactFirst",
    "contactLast",
    "phone",
    "email",
    "address",
    "city",
    "state",
    "zip"
  ],
  legal: [
    "legalName",
    "federalTaxId",
    "stateOfIncorporation",
    "businessStructure",
    "dateEstablished",
    "ownerName",
    "ownerTitle",
    "ownerDob",
    "ownerSsn",
    "ownerAddress",
    "ownerCity"
  ],
  processing: [
    "monthlyVolume",
    "avgTicket",
    "highTicket",
    "currentProcessor",
    "acceptedCards",
    "ecommercePercent",
    "inPersonPercent",
    "keyed"
  ]
};

interface MerchantForm {
  // business
  dbaName: string;
  products: string;
  natureOfBusiness: string;
  contactFirst: string;
  contactLast: string;
  phone: string;
  email: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;

  // legal
  legalName: string;
  federalTaxId: string;
  stateOfIncorporation: string;
  businessStructure: string;
  dateEstablished: string;
  ownerName: string;
  ownerTitle: string;
  ownerDob: string;
  ownerSsn: string;
  ownerAddress: string;
  ownerCity: string;
  ownerState: string;
  ownerZip: string;

  // processing
  monthlyVolume: string;
  avgTicket: string;
  highTicket: string;
  currentProcessor: string;
  acceptedCards: string;
  ecommercePercent: string;
  inPersonPercent: string;
  keyed: string;
  website: string;
  notes: string;
}

const initialState: MerchantForm = {
  dbaName: "",
  products: "",
  natureOfBusiness: "",
  contactFirst: "",
  contactLast: "",
  phone: "",
  email: "",
  address: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  legalName: "",
  federalTaxId: "",
  stateOfIncorporation: "",
  businessStructure: "",
  dateEstablished: "",
  ownerName: "",
  ownerTitle: "",
  ownerDob: "",
  ownerSsn: "",
  ownerAddress: "",
  ownerCity: "",
  ownerState: "",
  ownerZip: "",
  monthlyVolume: "",
  avgTicket: "",
  highTicket: "",
  currentProcessor: "",
  acceptedCards: "",
  ecommercePercent: "",
  inPersonPercent: "",
  keyed: "",
  website: "",
  notes: ""
};

export default function MerchantApply() {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [form, setForm] = useState<MerchantForm>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleChange = <K extends keyof MerchantForm>(field: K, value: MerchantForm[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const getMissingFieldsForSection = (sectionKey: SectionKey) => {
    const required = REQUIRED_FIELDS[sectionKey] ?? [];
    return required.filter(field => !String(form[field as keyof MerchantForm] ?? "").trim());
  };

  const missingBySection = useMemo(() => ({
    business: getMissingFieldsForSection("business"),
    legal: getMissingFieldsForSection("legal"),
    processing: getMissingFieldsForSection("processing")
  }), [form]);

  const totalRequiredFields = REQUIRED_FIELDS.business.length + REQUIRED_FIELDS.legal.length + REQUIRED_FIELDS.processing.length;
  const completedRequiredFields =
    (REQUIRED_FIELDS.business.length - missingBySection.business.length) +
    (REQUIRED_FIELDS.legal.length - missingBySection.legal.length) +
    (REQUIRED_FIELDS.processing.length - missingBySection.processing.length);

  const progress = Math.round((completedRequiredFields / totalRequiredFields) * 100);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const messageContent = `
Products: ${form.products}
Nature: ${form.natureOfBusiness}
Legal Name: ${form.legalName}
Federal Tax ID: ${form.federalTaxId}
State of Inc: ${form.stateOfIncorporation}
Business Structure: ${form.businessStructure}
Date Established: ${form.dateEstablished}
Owner: ${form.ownerName} (${form.ownerTitle})
Owner DOB: ${form.ownerDob}
Owner Address: ${form.ownerAddress}, ${form.ownerCity}, ${form.ownerState} ${form.ownerZip}
Avg Ticket: $${form.avgTicket}
High Ticket: $${form.highTicket}
Current Processor: ${form.currentProcessor}
Accepted Cards: ${form.acceptedCards}
eCommerce: ${form.ecommercePercent}%
In-Person: ${form.inPersonPercent}%
Keyed: ${form.keyed}%
Website: ${form.website}
Address: ${form.address} ${form.address2}, ${form.city}, ${form.state} ${form.zip}

Notes: ${form.notes}
    `.trim();

    const { error } = await supabase.from("applications").insert({
      full_name: `${form.contactFirst} ${form.contactLast}`.trim(),
      email: form.email,
      phone: form.phone,
      company_name: form.dbaName,
      business_type: form.businessStructure || form.natureOfBusiness,
      monthly_volume: form.monthlyVolume,
      message: messageContent,
      status: "pending"
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message
      });
      return;
    }

    setIsSubmitted(true);
  };

  const currentStep = STEPS[stepIndex];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-lg text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Application Received!</h1>
          <p className="text-gray-600">
            Thank you for your interest. Our team will review your application and contact you within 1-2 business days.
          </p>
          <a
            href="https://merchanthaus.io"
            className="inline-block mt-4 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Return to Website
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Merchant Preboarding</h1>
              <p className="text-xs text-gray-500">Intake Wizard v2.4</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-2 w-32 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm font-medium text-gray-700">{progress}% Complete</span>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Step Navigation */}
          <nav className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === stepIndex;
              const isCompleted = index < stepIndex;
              
              return (
                <button
                  key={step.label}
                  onClick={() => setStepIndex(index)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg flex-1 min-w-[180px] transition-all border-b-2",
                    isActive
                      ? "bg-white border-emerald-500 shadow-sm"
                      : isCompleted
                        ? "bg-white/50 border-emerald-300"
                        : "bg-transparent border-transparent hover:bg-white/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isActive
                      ? "bg-emerald-100 text-emerald-600"
                      : isCompleted
                        ? "bg-emerald-50 text-emerald-500"
                        : "bg-gray-100 text-gray-400"
                  )}>
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className={cn(
                      "text-sm font-medium",
                      isActive ? "text-emerald-600" : isCompleted ? "text-emerald-500" : "text-gray-500"
                    )}>
                      {step.label.split(" ")[0]}
                    </p>
                    <p className={cn(
                      "text-xs",
                      isActive ? "text-emerald-600" : "text-gray-400"
                    )}>
                      {step.label.split(" ").slice(1).join(" ") || "Profile"}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                {/* Step Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="font-medium">Step {stepIndex + 1}: {currentStep.label}</span>
                    <span className="text-gray-300">•</span>
                    <span>{stepIndex + 1} of {STEPS.length}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{currentStep.label}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Please complete all required fields marked with <span className="text-red-500">*</span>
                  </p>
                </div>

                {/* Step Content */}
                {stepIndex === 0 && (
                  <BusinessProfileStep form={form} onChange={handleChange} />
                )}
                {stepIndex === 1 && (
                  <LegalInfoStep form={form} onChange={handleChange} />
                )}
                {stepIndex === 2 && (
                  <ProcessingStep form={form} onChange={handleChange} />
                )}
                {stepIndex === 3 && (
                  <ReviewStep form={form} missingBySection={missingBySection} onSubmit={handleSubmit} isSubmitting={isSubmitting} progress={progress} />
                )}
              </div>

              {/* Navigation */}
              {stepIndex < 3 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    onClick={() => setStepIndex(prev => Math.max(0, prev - 1))}
                    disabled={stepIndex === 0}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                    onClick={() => setStepIndex(prev => Math.min(STEPS.length - 1, prev + 1))}
                  >
                    Next Step
                  </button>
                </div>
              )}
            </section>

            {/* Sidebar */}
            <aside className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
                  <AlertCircle className="w-4 h-4 text-emerald-600" />
                  Status Snapshot
                </div>

                <div className="space-y-4">
                  <SectionStatus
                    label="Business Profile"
                    count={REQUIRED_FIELDS.business.length - missingBySection.business.length}
                    total={REQUIRED_FIELDS.business.length}
                  />
                  <SectionStatus
                    label="Legal Info"
                    count={REQUIRED_FIELDS.legal.length - missingBySection.legal.length}
                    total={REQUIRED_FIELDS.legal.length}
                  />
                  <SectionStatus
                    label="Processing"
                    count={REQUIRED_FIELDS.processing.length - missingBySection.processing.length}
                    total={REQUIRED_FIELDS.processing.length}
                  />
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Missing Items</p>
                  <ul className="space-y-1 text-sm">
                    {missingBySection.business.length > 0 && (
                      <li className="text-red-500">
                        <span className="font-medium">Business:</span> {missingBySection.business.length} fields remaining
                      </li>
                    )}
                    {missingBySection.legal.length > 0 && (
                      <li className="text-red-500">
                        <span className="font-medium">Legal:</span> {missingBySection.legal.length} fields remaining
                      </li>
                    )}
                    {missingBySection.processing.length > 0 && (
                      <li className="text-red-500">
                        <span className="font-medium">Processing:</span> {missingBySection.processing.length} fields remaining
                      </li>
                    )}
                    {progress === 100 && (
                      <li className="text-emerald-600 font-medium">All fields complete! ✓</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Tip</p>
                    <p className="text-xs text-blue-700 mt-1">
                      If your business does not currently have a processor, we will ask for additional documentation readiness checks after you click "Complete".
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: ReactNode; hint?: string }) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="flex items-center gap-1 font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
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
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
        props.className
      )}
    />
  );
}

function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input type="number" step="any" min="0" {...props} />;
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[80px]",
        props.className
      )}
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
        props.className
      )}
    >
      {children}
    </select>
  );
}

function SectionStatus({ label, count, total }: { label: string; count: number; total: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{count}/{total}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn("h-full transition-all", count === total ? "bg-emerald-500" : "bg-emerald-400")}
          style={{ width: `${(count / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-start">
        <span className="bg-white pr-3 text-sm font-medium text-gray-500">{label}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step Components
// ─────────────────────────────────────────────────────────────────────────────

function BusinessProfileStep({ form, onChange }: { form: MerchantForm; onChange: <K extends keyof MerchantForm>(field: K, value: MerchantForm[K]) => void }) {
  return (
    <div className="space-y-4">
      <Field label="DBA Name" required hint="Doing Business As...">
        <Input
          value={form.dbaName}
          onChange={e => onChange("dbaName", e.target.value)}
          placeholder="Doing Business As..."
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Products / Services" required>
          <Input
            value={form.products}
            onChange={e => onChange("products", e.target.value)}
            placeholder="e.g. Shoes, Consulting"
          />
        </Field>
        <Field label="Nature of Business" required>
          <Input
            value={form.natureOfBusiness}
            onChange={e => onChange("natureOfBusiness", e.target.value)}
            placeholder="e.g. Retail, eCommerce"
          />
        </Field>
      </div>

      <Divider label="Contact Information" />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="First Name" required>
          <Input
            value={form.contactFirst}
            onChange={e => onChange("contactFirst", e.target.value)}
          />
        </Field>
        <Field label="Last Name" required>
          <Input
            value={form.contactLast}
            onChange={e => onChange("contactLast", e.target.value)}
          />
        </Field>
        <Field label="Phone Number" required>
          <Input
            value={form.phone}
            onChange={e => onChange("phone", e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </Field>
        <Field label="Email Address" required>
          <Input
            type="email"
            value={form.email}
            onChange={e => onChange("email", e.target.value)}
            placeholder="name@business.com"
          />
        </Field>
      </div>

      <Divider label="Location" />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Address Line 1" required>
          <Input
            value={form.address}
            onChange={e => onChange("address", e.target.value)}
          />
        </Field>
        <Field label="Address Line 2">
          <Input
            value={form.address2}
            onChange={e => onChange("address2", e.target.value)}
            placeholder="Suite, Unit, etc."
          />
        </Field>
        <Field label="City" required>
          <Input
            value={form.city}
            onChange={e => onChange("city", e.target.value)}
          />
        </Field>
        <Field label="State" required>
          <Input
            value={form.state}
            onChange={e => onChange("state", e.target.value)}
          />
        </Field>
        <Field label="ZIP Code" required>
          <Input
            value={form.zip}
            onChange={e => onChange("zip", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function LegalInfoStep({ form, onChange }: { form: MerchantForm; onChange: <K extends keyof MerchantForm>(field: K, value: MerchantForm[K]) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Legal Business Name" required>
        <Input
          value={form.legalName}
          onChange={e => onChange("legalName", e.target.value)}
          placeholder="As registered with state/IRS"
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Federal Tax ID (EIN)" required>
          <Input
            value={form.federalTaxId}
            onChange={e => onChange("federalTaxId", e.target.value)}
            placeholder="XX-XXXXXXX"
          />
        </Field>
        <Field label="State of Incorporation" required>
          <Input
            value={form.stateOfIncorporation}
            onChange={e => onChange("stateOfIncorporation", e.target.value)}
          />
        </Field>
        <Field label="Business Structure" required>
          <Select
            value={form.businessStructure}
            onChange={e => onChange("businessStructure", e.target.value)}
          >
            <option value="">Select structure...</option>
            <option value="sole_proprietor">Sole Proprietor</option>
            <option value="llc">LLC</option>
            <option value="corporation">Corporation</option>
            <option value="partnership">Partnership</option>
            <option value="nonprofit">Non-Profit</option>
          </Select>
        </Field>
        <Field label="Date Established" required>
          <Input
            type="date"
            value={form.dateEstablished}
            onChange={e => onChange("dateEstablished", e.target.value)}
          />
        </Field>
      </div>

      <Divider label="Principal Owner Information" />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Owner Full Name" required>
          <Input
            value={form.ownerName}
            onChange={e => onChange("ownerName", e.target.value)}
          />
        </Field>
        <Field label="Title" required>
          <Input
            value={form.ownerTitle}
            onChange={e => onChange("ownerTitle", e.target.value)}
            placeholder="e.g. CEO, Owner, President"
          />
        </Field>
        <Field label="Date of Birth" required>
          <Input
            type="date"
            value={form.ownerDob}
            onChange={e => onChange("ownerDob", e.target.value)}
          />
        </Field>
        <Field label="SSN (last 4 digits)" required hint="Used for verification only">
          <Input
            value={form.ownerSsn}
            onChange={e => onChange("ownerSsn", e.target.value)}
            placeholder="XXXX"
            maxLength={4}
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Owner Home Address" required>
          <Input
            value={form.ownerAddress}
            onChange={e => onChange("ownerAddress", e.target.value)}
          />
        </Field>
        <Field label="City" required>
          <Input
            value={form.ownerCity}
            onChange={e => onChange("ownerCity", e.target.value)}
          />
        </Field>
        <Field label="State">
          <Input
            value={form.ownerState}
            onChange={e => onChange("ownerState", e.target.value)}
          />
        </Field>
        <Field label="ZIP">
          <Input
            value={form.ownerZip}
            onChange={e => onChange("ownerZip", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function ProcessingStep({ form, onChange }: { form: MerchantForm; onChange: <K extends keyof MerchantForm>(field: K, value: MerchantForm[K]) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Monthly Volume ($)" required hint="Estimated monthly credit card sales">
          <NumberInput
            value={form.monthlyVolume}
            onChange={e => onChange("monthlyVolume", e.target.value)}
            placeholder="50000"
          />
        </Field>
        <Field label="Average Ticket ($)" required hint="Average transaction amount">
          <NumberInput
            value={form.avgTicket}
            onChange={e => onChange("avgTicket", e.target.value)}
            placeholder="75"
          />
        </Field>
        <Field label="High Ticket ($)" required hint="Largest expected transaction">
          <NumberInput
            value={form.highTicket}
            onChange={e => onChange("highTicket", e.target.value)}
            placeholder="500"
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Current Processor" required hint="If none, enter 'None'">
          <Input
            value={form.currentProcessor}
            onChange={e => onChange("currentProcessor", e.target.value)}
            placeholder="e.g. Square, Stripe, None"
          />
        </Field>
        <Field label="Accepted Card Types" required>
          <Input
            value={form.acceptedCards}
            onChange={e => onChange("acceptedCards", e.target.value)}
            placeholder="Visa, Mastercard, Amex, Discover"
          />
        </Field>
      </div>

      <Divider label="Transaction Mix" />

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="eCommerce %" required hint="Online transactions">
          <NumberInput
            value={form.ecommercePercent}
            onChange={e => onChange("ecommercePercent", e.target.value)}
            placeholder="30"
          />
        </Field>
        <Field label="In-Person %" required hint="Card-present transactions">
          <NumberInput
            value={form.inPersonPercent}
            onChange={e => onChange("inPersonPercent", e.target.value)}
            placeholder="60"
          />
        </Field>
        <Field label="Keyed %" required hint="Manually entered">
          <NumberInput
            value={form.keyed}
            onChange={e => onChange("keyed", e.target.value)}
            placeholder="10"
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Website" hint="Optional - your business website">
          <Input
            value={form.website}
            onChange={e => onChange("website", e.target.value)}
            placeholder="https://yourbusiness.com"
          />
        </Field>
      </div>

      <Field label="Additional Notes" hint="Any other information you'd like us to know">
        <Textarea
          value={form.notes}
          onChange={e => onChange("notes", e.target.value)}
          placeholder="Tell us more about your business..."
        />
      </Field>
    </div>
  );
}

function ReviewStep({ 
  form, 
  missingBySection, 
  onSubmit, 
  isSubmitting, 
  progress 
}: { 
  form: MerchantForm; 
  missingBySection: Record<SectionKey, string[]>; 
  onSubmit: () => void;
  isSubmitting: boolean;
  progress: number;
}) {
  const allComplete = progress === 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        Application Readiness
      </div>

      {!allComplete && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Missing Required Information</p>
              <p className="mt-1">Please complete all required fields before submitting your application.</p>
            </div>
          </div>
        </div>
      )}

      {allComplete && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Ready to Submit!</p>
              <p className="mt-1">All required fields are complete. Review your information below and click Submit.</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Business Information</h3>
          <dl className="grid gap-2 text-sm md:grid-cols-2">
            <DataItem label="DBA Name" value={form.dbaName} />
            <DataItem label="Products/Services" value={form.products} />
            <DataItem label="Nature of Business" value={form.natureOfBusiness} />
            <DataItem label="Contact" value={`${form.contactFirst} ${form.contactLast}`} />
            <DataItem label="Email" value={form.email} />
            <DataItem label="Phone" value={form.phone} />
            <DataItem label="Address" value={`${form.address} ${form.address2}, ${form.city}, ${form.state} ${form.zip}`} />
          </dl>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Legal Information</h3>
          <dl className="grid gap-2 text-sm md:grid-cols-2">
            <DataItem label="Legal Name" value={form.legalName} />
            <DataItem label="Federal Tax ID" value={form.federalTaxId} />
            <DataItem label="State of Inc." value={form.stateOfIncorporation} />
            <DataItem label="Structure" value={form.businessStructure} />
            <DataItem label="Date Established" value={form.dateEstablished} />
            <DataItem label="Owner" value={`${form.ownerName} (${form.ownerTitle})`} />
          </dl>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Processing Information</h3>
          <dl className="grid gap-2 text-sm md:grid-cols-3">
            <DataItem label="Monthly Volume" value={form.monthlyVolume ? `$${form.monthlyVolume}` : ""} />
            <DataItem label="Average Ticket" value={form.avgTicket ? `$${form.avgTicket}` : ""} />
            <DataItem label="High Ticket" value={form.highTicket ? `$${form.highTicket}` : ""} />
            <DataItem label="Current Processor" value={form.currentProcessor} />
            <DataItem label="eCommerce" value={form.ecommercePercent ? `${form.ecommercePercent}%` : ""} />
            <DataItem label="In-Person" value={form.inPersonPercent ? `${form.inPersonPercent}%` : ""} />
          </dl>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          type="button"
          className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          onClick={onSubmit}
          disabled={!allComplete || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : (
            <>
              <CheckCircle className="w-4 h-4" />
              Complete Application
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium">{value || <span className="text-gray-400 font-normal italic">Not provided</span>}</dd>
    </div>
  );
}
