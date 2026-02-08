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
import merchanthausLogo from "@/assets/merchanthaus-logo.png";

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

const FIELD_LABELS: Record<string, string> = {
  dbaName: "DBA Name",
  products: "Products / Services",
  natureOfBusiness: "Nature of Business",
  contactFirst: "First Name",
  contactLast: "Last Name",
  phone: "Phone Number",
  email: "Email Address",
  address: "Address",
  city: "City",
  state: "State",
  zip: "ZIP Code",
  legalName: "Legal Business Name",
  federalTaxId: "Federal Tax ID",
  stateOfIncorporation: "State of Incorporation",
  businessStructure: "Business Structure",
  dateEstablished: "Date Established",
  ownerName: "Owner Full Name",
  ownerTitle: "Title",
  ownerDob: "Date of Birth",
  ownerSsn: "SSN (last 4)",
  ownerAddress: "Owner Home Address",
  ownerCity: "Owner City",
  monthlyVolume: "Monthly Volume",
  avgTicket: "Average Ticket",
  highTicket: "High Ticket",
  currentProcessor: "Current Processor",
  acceptedCards: "Accepted Card Types",
  ecommercePercent: "eCommerce %",
  inPersonPercent: "In-Person %",
  keyed: "Keyed %"
};

interface MerchantForm {
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

type TouchedFields = Partial<Record<keyof MerchantForm, boolean>>;

function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return null;
}

function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "Phone number is required";
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length < 10) return "Please enter a valid phone number";
  return null;
}

function validateSsn(ssn: string): string | null {
  if (!ssn.trim()) return "Last 4 digits of SSN is required";
  if (ssn.length !== 4 || !/^\d{4}$/.test(ssn)) return "Please enter exactly 4 digits";
  return null;
}

function validatePercentage(value: string, fieldName: string): string | null {
  if (!value.trim()) return `${fieldName} is required`;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0 || num > 100) return "Must be between 0 and 100";
  return null;
}

function validateRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) return `${fieldName} is required`;
  return null;
}

function getFieldError(field: keyof MerchantForm, value: string): string | null {
  const label = FIELD_LABELS[field] || field;
  
  switch (field) {
    case "email":
      return validateEmail(value);
    case "phone":
      return validatePhone(value);
    case "ownerSsn":
      return validateSsn(value);
    case "ecommercePercent":
    case "inPersonPercent":
    case "keyed":
      return validatePercentage(value, label);
    default:
      const allRequired = [...REQUIRED_FIELDS.business, ...REQUIRED_FIELDS.legal, ...REQUIRED_FIELDS.processing];
      if (allRequired.includes(field)) {
        return validateRequired(value, label);
      }
      return null;
  }
}

export default function MerchantApply() {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [form, setForm] = useState<MerchantForm>(initialState);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleChange = <K extends keyof MerchantForm>(field: K, value: MerchantForm[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof MerchantForm) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getError = (field: keyof MerchantForm): string | null => {
    if (!touched[field] && !showAllErrors) return null;
    return getFieldError(field, form[field]);
  };

  const getMissingFieldsForSection = (sectionKey: SectionKey) => {
    const required = REQUIRED_FIELDS[sectionKey] ?? [];
    return required.filter(field => !String(form[field as keyof MerchantForm] ?? "").trim());
  };

  const getErrorsForSection = (sectionKey: SectionKey): string[] => {
    const required = REQUIRED_FIELDS[sectionKey] ?? [];
    return required
      .map(field => getFieldError(field as keyof MerchantForm, form[field as keyof MerchantForm]))
      .filter((error): error is string => error !== null);
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

  const validateCurrentStep = (): boolean => {
    const sectionMap: Record<number, SectionKey | null> = {
      0: "business",
      1: "legal",
      2: "processing",
      3: null
    };
    
    const section = sectionMap[stepIndex];
    if (!section) return true;
    
    const errors = getErrorsForSection(section);
    if (errors.length > 0) {
      const fields = REQUIRED_FIELDS[section];
      const newTouched: TouchedFields = {};
      fields.forEach(field => {
        newTouched[field as keyof MerchantForm] = true;
      });
      setTouched(prev => ({ ...prev, ...newTouched }));
      
      toast({
        variant: "destructive",
        title: "Please fix the errors",
        description: `${errors.length} field(s) need attention before continuing.`
      });
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setStepIndex(prev => Math.min(STEPS.length - 1, prev + 1));
    }
  };

  const handleSubmit = async () => {
    setShowAllErrors(true);
    
    const allErrors = [
      ...getErrorsForSection("business"),
      ...getErrorsForSection("legal"),
      ...getErrorsForSection("processing")
    ];
    
    if (allErrors.length > 0) {
      toast({
        variant: "destructive",
        title: "Please complete all required fields",
        description: `${allErrors.length} field(s) need attention.`
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("applications").insert({
      full_name: `${form.contactFirst} ${form.contactLast}`.trim(),
      email: form.email,
      phone: form.phone,
      company_name: form.dbaName,
      business_type: form.businessStructure || form.natureOfBusiness,
      monthly_volume: form.monthlyVolume,
      message: form.notes || null,
      status: "pending",
      dba_name: form.dbaName || null,
      products: form.products || null,
      nature_of_business: form.natureOfBusiness || null,
      address: form.address || null,
      address2: form.address2 || null,
      city: form.city || null,
      state: form.state || null,
      zip: form.zip || null,
      legal_name: form.legalName || null,
      federal_tax_id: form.federalTaxId || null,
      state_of_incorporation: form.stateOfIncorporation || null,
      business_structure: form.businessStructure || null,
      date_established: form.dateEstablished || null,
      owner_name: form.ownerName || null,
      owner_title: form.ownerTitle || null,
      owner_dob: form.ownerDob || null,
      owner_ssn_last4: form.ownerSsn || null,
      owner_address: form.ownerAddress || null,
      owner_city: form.ownerCity || null,
      owner_state: form.ownerState || null,
      owner_zip: form.ownerZip || null,
      avg_ticket: form.avgTicket || null,
      high_ticket: form.highTicket || null,
      current_processor: form.currentProcessor || null,
      accepted_cards: form.acceptedCards || null,
      ecommerce_percent: form.ecommercePercent || null,
      in_person_percent: form.inPersonPercent || null,
      keyed_percent: form.keyed || null,
      website: form.website || null,
      notes: form.notes || null,
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

    window.location.href = "https://merchanthaus.io";
  };

  const currentStep = STEPS[stepIndex];

  if (isSubmitted) {
    return (
      <div className="merchant-form fixed inset-0 z-50 bg-background flex items-center justify-center p-4 overflow-y-auto">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 shadow-lg text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Application Received!</h1>
          <p className="text-muted-foreground">
            Thank you for your interest. Our team will review your application and contact you within 1-2 business days.
          </p>
          <a
            href="https://merchanthaus.io"
            className="inline-block mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Return to Website
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="merchant-form fixed inset-0 z-50 bg-background overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Header */}
      <header className="bg-card border-b border-border px-3 py-2.5 md:px-4 md:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={merchanthausLogo} 
              alt="MerchantHaus" 
              className="h-7 md:h-10 w-auto"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 md:h-2 md:w-32 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs md:text-sm font-medium text-foreground">{progress}%</span>
          </div>
        </div>
      </header>

      <div className="p-3 md:p-8">
        <div className="max-w-6xl mx-auto space-y-3 md:space-y-6">
          {/* Step Navigation */}
          <nav className="flex items-center justify-between gap-1 md:gap-2 overflow-x-auto pb-1 md:pb-2">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === stepIndex;
              const isCompleted = index < stepIndex;
              
              return (
                <button
                  key={step.label}
                  onClick={() => setStepIndex(index)}
                  className={cn(
                    "flex items-center gap-1.5 md:gap-3 px-2 py-1.5 md:px-4 md:py-3 rounded-lg flex-1 min-w-0 transition-all border-b-2",
                    isActive
                      ? "bg-card border-primary shadow-sm"
                      : isCompleted
                        ? "bg-card/50 border-primary/50"
                        : "bg-transparent border-transparent hover:bg-card/50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : isCompleted
                        ? "bg-primary/5 text-primary/70"
                        : "bg-secondary text-muted-foreground"
                  )}>
                    <StepIcon className="w-3 h-3 md:w-5 md:h-5" />
                  </div>
                  <div className="text-left min-w-0 hidden sm:block">
                    <p className={cn(
                      "text-xs md:text-sm font-medium truncate",
                      isActive ? "text-primary" : isCompleted ? "text-primary/70" : "text-muted-foreground"
                    )}>
                      {step.label.split(" ")[0]}
                    </p>
                    <p className={cn(
                      "text-[10px] md:text-xs truncate",
                      isActive ? "text-primary" : "text-muted-foreground"
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
            <section className="bg-card rounded-xl md:rounded-2xl border border-border shadow-sm overflow-visible">
              <div className="p-4 md:p-6">
                {/* Step Header */}
                <div className="mb-4 md:mb-6">
                  <div className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground mb-1 md:mb-2">
                    <span className="font-medium">Step {stepIndex + 1}: {currentStep.label}</span>
                    <span className="text-border">•</span>
                    <span>{stepIndex + 1} of {STEPS.length}</span>
                  </div>
                  <h2 className="text-base md:text-xl font-semibold text-foreground">{currentStep.label}</h2>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                    Please complete all required fields marked with <span className="text-destructive">*</span>
                  </p>
                </div>

                {/* Step Content */}
                {stepIndex === 0 && (
                  <BusinessProfileStep form={form} onChange={handleChange} onBlur={handleBlur} getError={getError} />
                )}
                {stepIndex === 1 && (
                  <LegalInfoStep form={form} onChange={handleChange} onBlur={handleBlur} getError={getError} />
                )}
                {stepIndex === 2 && (
                  <ProcessingStep form={form} onChange={handleChange} onBlur={handleBlur} getError={getError} />
                )}
                {stepIndex === 3 && (
                  <ReviewStep form={form} missingBySection={missingBySection} onSubmit={handleSubmit} isSubmitting={isSubmitting} progress={progress} />
                )}
              </div>

              {/* Navigation */}
              {stepIndex < 3 && (
                <div className="px-4 py-3 md:px-6 md:py-4 bg-muted border-t border-border flex items-center justify-between">
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-card px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
                    onClick={() => setStepIndex(prev => Math.max(0, prev - 1))}
                    disabled={stepIndex === 0}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    className="rounded-lg bg-primary px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                    onClick={handleNextStep}
                  >
                    Next Step
                  </button>
                </div>
              )}
            </section>

            {/* Sidebar */}
            <aside className="space-y-3 md:space-y-4">
              <div className="bg-card rounded-xl md:rounded-2xl border border-border shadow-sm p-3 md:p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                  <AlertCircle className="w-4 h-4 text-primary" />
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

                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Missing Items</p>
                  <ul className="space-y-1 text-sm">
                    {missingBySection.business.length > 0 && (
                      <li className="text-destructive">
                        <span className="font-medium">Business:</span> {missingBySection.business.length} fields remaining
                      </li>
                    )}
                    {missingBySection.legal.length > 0 && (
                      <li className="text-destructive">
                        <span className="font-medium">Legal:</span> {missingBySection.legal.length} fields remaining
                      </li>
                    )}
                    {missingBySection.processing.length > 0 && (
                      <li className="text-destructive">
                        <span className="font-medium">Processing:</span> {missingBySection.processing.length} fields remaining
                      </li>
                    )}
                    {progress === 100 && (
                      <li className="text-success font-medium">All fields complete! ✓</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="bg-info/10 rounded-xl md:rounded-2xl border border-info/20 p-3 md:p-5">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-info-foreground">Tip</p>
                    <p className="text-xs text-info/80 mt-1">
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

interface FieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
  error?: string | null;
}

function Field({ label, required, children, hint, error }: FieldProps) {
  return (
    <label className="space-y-1 md:space-y-1.5 text-xs md:text-sm">
      <span className="flex items-center gap-1 font-medium text-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
      </span>
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {!error && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

function Input({ hasError, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border bg-card px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2",
        hasError
          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
          : "border-input focus:border-primary focus:ring-primary/20",
        props.className
      )}
    />
  );
}

function NumberInput(props: InputProps) {
  return <Input type="number" step="any" min="0" {...props} />;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

function Textarea({ hasError, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border bg-card px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 min-h-[60px] md:min-h-[80px]",
        hasError
          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
          : "border-input focus:border-primary focus:ring-primary/20",
        props.className
      )}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
  hasError?: boolean;
}

function Select({ children, hasError, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-lg border bg-card px-2.5 py-2 md:px-3 md:py-2.5 text-xs md:text-sm text-foreground shadow-sm focus:outline-none focus:ring-2",
        hasError
          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
          : "border-input focus:border-primary focus:ring-primary/20",
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
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{count}/{total}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full transition-all", count === total ? "bg-primary" : "bg-primary/70")}
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
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-start">
        <span className="bg-card pr-3 text-sm font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step Components
// ─────────────────────────────────────────────────────────────────────────────

interface StepProps {
  form: MerchantForm;
  onChange: <K extends keyof MerchantForm>(field: K, value: MerchantForm[K]) => void;
  onBlur: (field: keyof MerchantForm) => void;
  getError: (field: keyof MerchantForm) => string | null;
}

function BusinessProfileStep({ form, onChange, onBlur, getError }: StepProps) {
  return (
    <div className="space-y-3 md:space-y-4">
      <Field label="DBA Name" required hint="Doing Business As..." error={getError("dbaName")}>
        <Input
          value={form.dbaName}
          onChange={e => onChange("dbaName", e.target.value)}
          onBlur={() => onBlur("dbaName")}
          placeholder="Doing Business As..."
          hasError={!!getError("dbaName")}
        />
      </Field>

      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        <Field label="Products / Services" required error={getError("products")}>
          <Input
            value={form.products}
            onChange={e => onChange("products", e.target.value)}
            onBlur={() => onBlur("products")}
            placeholder="e.g. Shoes, Consulting"
            hasError={!!getError("products")}
          />
        </Field>
        <Field label="Nature of Business" required error={getError("natureOfBusiness")}>
          <Input
            value={form.natureOfBusiness}
            onChange={e => onChange("natureOfBusiness", e.target.value)}
            onBlur={() => onBlur("natureOfBusiness")}
            placeholder="e.g. Retail, eCommerce"
            hasError={!!getError("natureOfBusiness")}
          />
        </Field>
      </div>

      <Divider label="Contact Information" />

      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        <Field label="First Name" required error={getError("contactFirst")}>
          <Input
            value={form.contactFirst}
            onChange={e => onChange("contactFirst", e.target.value)}
            onBlur={() => onBlur("contactFirst")}
            hasError={!!getError("contactFirst")}
          />
        </Field>
        <Field label="Last Name" required error={getError("contactLast")}>
          <Input
            value={form.contactLast}
            onChange={e => onChange("contactLast", e.target.value)}
            onBlur={() => onBlur("contactLast")}
            hasError={!!getError("contactLast")}
          />
        </Field>
        <Field label="Phone Number" required error={getError("phone")}>
          <Input
            value={form.phone}
            onChange={e => onChange("phone", e.target.value)}
            onBlur={() => onBlur("phone")}
            placeholder="+1 (555) 000-0000"
            hasError={!!getError("phone")}
          />
        </Field>
        <Field label="Email Address" required error={getError("email")}>
          <Input
            type="email"
            value={form.email}
            onChange={e => onChange("email", e.target.value)}
            onBlur={() => onBlur("email")}
            placeholder="name@business.com"
            hasError={!!getError("email")}
          />
        </Field>
      </div>

      <Divider label="Location" />

      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        <Field label="Address Line 1" required error={getError("address")}>
          <Input
            value={form.address}
            onChange={e => onChange("address", e.target.value)}
            onBlur={() => onBlur("address")}
            hasError={!!getError("address")}
          />
        </Field>
        <Field label="Address Line 2">
          <Input
            value={form.address2}
            onChange={e => onChange("address2", e.target.value)}
            placeholder="Suite, Unit, etc."
          />
        </Field>
        <Field label="City" required error={getError("city")}>
          <Input
            value={form.city}
            onChange={e => onChange("city", e.target.value)}
            onBlur={() => onBlur("city")}
            hasError={!!getError("city")}
          />
        </Field>
        <Field label="State" required error={getError("state")}>
          <Input
            value={form.state}
            onChange={e => onChange("state", e.target.value)}
            onBlur={() => onBlur("state")}
            hasError={!!getError("state")}
          />
        </Field>
        <Field label="ZIP Code" required error={getError("zip")}>
          <Input
            value={form.zip}
            onChange={e => onChange("zip", e.target.value)}
            onBlur={() => onBlur("zip")}
            hasError={!!getError("zip")}
          />
        </Field>
      </div>
    </div>
  );
}

function LegalInfoStep({ form, onChange, onBlur, getError }: StepProps) {
  return (
    <div className="space-y-3 md:space-y-4">
      <Field label="Legal Business Name" required error={getError("legalName")}>
        <Input
          value={form.legalName}
          onChange={e => onChange("legalName", e.target.value)}
          onBlur={() => onBlur("legalName")}
          placeholder="As registered with state/IRS"
          hasError={!!getError("legalName")}
        />
      </Field>

      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        <Field label="Federal Tax ID (EIN)" required error={getError("federalTaxId")}>
          <Input
            value={form.federalTaxId}
            onChange={e => onChange("federalTaxId", e.target.value)}
            onBlur={() => onBlur("federalTaxId")}
            placeholder="XX-XXXXXXX"
            hasError={!!getError("federalTaxId")}
          />
        </Field>
        <Field label="State of Incorporation" required error={getError("stateOfIncorporation")}>
          <Input
            value={form.stateOfIncorporation}
            onChange={e => onChange("stateOfIncorporation", e.target.value)}
            onBlur={() => onBlur("stateOfIncorporation")}
            hasError={!!getError("stateOfIncorporation")}
          />
        </Field>
        <Field label="Business Structure" required error={getError("businessStructure")}>
          <Select
            value={form.businessStructure}
            onChange={e => onChange("businessStructure", e.target.value)}
            onBlur={() => onBlur("businessStructure")}
            hasError={!!getError("businessStructure")}
          >
            <option value="">Select structure...</option>
            <option value="sole_proprietor">Sole Proprietor</option>
            <option value="llc">LLC</option>
            <option value="corporation">Corporation</option>
            <option value="partnership">Partnership</option>
            <option value="nonprofit">Non-Profit</option>
          </Select>
        </Field>
        <Field label="Date Established" required error={getError("dateEstablished")}>
          <Input
            type="date"
            value={form.dateEstablished}
            onChange={e => onChange("dateEstablished", e.target.value)}
            onBlur={() => onBlur("dateEstablished")}
            hasError={!!getError("dateEstablished")}
          />
        </Field>
      </div>

      <Divider label="Principal Owner Information" />

      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        <Field label="Owner Full Name" required error={getError("ownerName")}>
          <Input
            value={form.ownerName}
            onChange={e => onChange("ownerName", e.target.value)}
            onBlur={() => onBlur("ownerName")}
            hasError={!!getError("ownerName")}
          />
        </Field>
        <Field label="Title" required error={getError("ownerTitle")}>
          <Input
            value={form.ownerTitle}
            onChange={e => onChange("ownerTitle", e.target.value)}
            onBlur={() => onBlur("ownerTitle")}
            placeholder="e.g. CEO, Owner, President"
            hasError={!!getError("ownerTitle")}
          />
        </Field>
        <Field label="Date of Birth" required error={getError("ownerDob")}>
          <Input
            type="date"
            value={form.ownerDob}
            onChange={e => onChange("ownerDob", e.target.value)}
            onBlur={() => onBlur("ownerDob")}
            hasError={!!getError("ownerDob")}
          />
        </Field>
        <Field label="SSN (last 4 digits)" required hint="Used for verification only" error={getError("ownerSsn")}>
          <Input
            value={form.ownerSsn}
            onChange={e => onChange("ownerSsn", e.target.value)}
            onBlur={() => onBlur("ownerSsn")}
            placeholder="XXXX"
            maxLength={4}
            hasError={!!getError("ownerSsn")}
          />
        </Field>
      </div>

      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        <Field label="Owner Home Address" required error={getError("ownerAddress")}>
          <Input
            value={form.ownerAddress}
            onChange={e => onChange("ownerAddress", e.target.value)}
            onBlur={() => onBlur("ownerAddress")}
            hasError={!!getError("ownerAddress")}
          />
        </Field>
        <Field label="City" required error={getError("ownerCity")}>
          <Input
            value={form.ownerCity}
            onChange={e => onChange("ownerCity", e.target.value)}
            onBlur={() => onBlur("ownerCity")}
            hasError={!!getError("ownerCity")}
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

function ProcessingStep({ form, onChange, onBlur, getError }: StepProps) {
  return (
    <div className="space-y-3 md:space-y-4">
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3">
        <Field label="Monthly Vol ($)" required hint="Est. monthly CC sales" error={getError("monthlyVolume")}>
          <NumberInput
            value={form.monthlyVolume}
            onChange={e => onChange("monthlyVolume", e.target.value)}
            onBlur={() => onBlur("monthlyVolume")}
            placeholder="50000"
            hasError={!!getError("monthlyVolume")}
          />
        </Field>
        <Field label="Avg Ticket ($)" required hint="Avg transaction" error={getError("avgTicket")}>
          <NumberInput
            value={form.avgTicket}
            onChange={e => onChange("avgTicket", e.target.value)}
            onBlur={() => onBlur("avgTicket")}
            placeholder="75"
            hasError={!!getError("avgTicket")}
          />
        </Field>
        <Field label="High Ticket ($)" required hint="Largest transaction" error={getError("highTicket")}>
          <NumberInput
            value={form.highTicket}
            onChange={e => onChange("highTicket", e.target.value)}
            onBlur={() => onBlur("highTicket")}
            placeholder="500"
            hasError={!!getError("highTicket")}
          />
        </Field>
      </div>

      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        <Field label="Current Processor" required hint="If none, enter 'None'" error={getError("currentProcessor")}>
          <Input
            value={form.currentProcessor}
            onChange={e => onChange("currentProcessor", e.target.value)}
            onBlur={() => onBlur("currentProcessor")}
            placeholder="e.g. Square, Stripe, None"
            hasError={!!getError("currentProcessor")}
          />
        </Field>
        <Field label="Accepted Card Types" required error={getError("acceptedCards")}>
          <Input
            value={form.acceptedCards}
            onChange={e => onChange("acceptedCards", e.target.value)}
            onBlur={() => onBlur("acceptedCards")}
            placeholder="Visa, Mastercard, Amex, Discover"
            hasError={!!getError("acceptedCards")}
          />
        </Field>
      </div>

      <Divider label="Transaction Mix" />

      <div className="grid gap-3 md:gap-4 grid-cols-3">
        <Field label="eCommerce %" required hint="Online transactions" error={getError("ecommercePercent")}>
          <NumberInput
            value={form.ecommercePercent}
            onChange={e => onChange("ecommercePercent", e.target.value)}
            onBlur={() => onBlur("ecommercePercent")}
            placeholder="30"
            hasError={!!getError("ecommercePercent")}
          />
        </Field>
        <Field label="In-Person %" required hint="Card-present transactions" error={getError("inPersonPercent")}>
          <NumberInput
            value={form.inPersonPercent}
            onChange={e => onChange("inPersonPercent", e.target.value)}
            onBlur={() => onBlur("inPersonPercent")}
            placeholder="60"
            hasError={!!getError("inPersonPercent")}
          />
        </Field>
        <Field label="Keyed %" required hint="Manually entered" error={getError("keyed")}>
          <NumberInput
            value={form.keyed}
            onChange={e => onChange("keyed", e.target.value)}
            onBlur={() => onBlur("keyed")}
            placeholder="10"
            hasError={!!getError("keyed")}
          />
        </Field>
      </div>

      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
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
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <CheckCircle2 className="w-5 h-5 text-primary" />
        Application Readiness
      </div>

      {!allComplete && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning-foreground">
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
        <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
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
        <div className="rounded-xl border border-border bg-muted p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Business Information</h3>
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

        <div className="rounded-xl border border-border bg-muted p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Legal Information</h3>
          <dl className="grid gap-2 text-sm md:grid-cols-2">
            <DataItem label="Legal Name" value={form.legalName} />
            <DataItem label="Federal Tax ID" value={form.federalTaxId} />
            <DataItem label="State of Inc." value={form.stateOfIncorporation} />
            <DataItem label="Structure" value={form.businessStructure} />
            <DataItem label="Date Established" value={form.dateEstablished} />
            <DataItem label="Owner" value={`${form.ownerName} (${form.ownerTitle})`} />
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-muted p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Processing Information</h3>
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

      <div className="pt-4 border-t border-border">
        <button
          type="button"
          className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium">{value || <span className="text-muted-foreground font-normal italic">Not provided</span>}</dd>
    </div>
  );
}
