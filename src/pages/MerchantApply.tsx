import { useMemo, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  BadgeCheck,
  CheckCircle2,
  ShieldCheck,
  Users,
  Send,
  CheckCircle
} from "lucide-react";

const STEPS = ["Business Profile", "Processing Info", "Review & Submit"] as const;

type SectionKey = "business" | "processing";

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
  processing: ["monthlyVolume", "avgTicket", "highTicket"]
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

  // processing
  monthlyVolume: string;
  avgTicket: string;
  highTicket: string;
  businessType: string;
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
  monthlyVolume: "",
  avgTicket: "",
  highTicket: "",
  businessType: "",
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
    processing: getMissingFieldsForSection("processing")
  }), [form]);

  const totalRequiredFields = REQUIRED_FIELDS.business.length + REQUIRED_FIELDS.processing.length;
  const completedRequiredFields =
    (REQUIRED_FIELDS.business.length - missingBySection.business.length) +
    (REQUIRED_FIELDS.processing.length - missingBySection.processing.length);

  const progress = Math.round((completedRequiredFields / totalRequiredFields) * 100);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const { error } = await supabase.from("applications").insert({
      full_name: `${form.contactFirst} ${form.contactLast}`.trim(),
      email: form.email,
      phone: form.phone,
      company_name: form.dbaName,
      business_type: form.businessType || form.natureOfBusiness,
      monthly_volume: form.monthlyVolume,
      message: `Products: ${form.products}\nNature: ${form.natureOfBusiness}\nAvg Ticket: $${form.avgTicket}\nHigh Ticket: $${form.highTicket}\nWebsite: ${form.website}\nAddress: ${form.address} ${form.address2}, ${form.city}, ${form.state} ${form.zip}\n\nNotes: ${form.notes}`,
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
      <div className="min-h-screen bg-merchant-black flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-merchant-gray bg-merchant-dark p-8 shadow-xl text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Application Received!</h1>
          <p className="text-gray-400">
            Thank you for your interest. Our team will review your application and contact you within 1-2 business days.
          </p>
          <a
            href="https://merchanthaus.io"
            className="inline-block mt-4 rounded-xl bg-merchant-red px-6 py-3 text-sm font-semibold text-white hover:bg-merchant-redLight transition-colors"
          >
            Return to Website
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-merchant-black">
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Merchant Application</h1>
              <p className="text-sm text-gray-400">Complete the form below to get started with payment processing.</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-48 rounded-full bg-merchant-gray overflow-hidden">
                  <div className="h-full bg-merchant-redLight transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-sm font-semibold text-white">{progress}% complete</span>
              </div>
            </div>

            <div className="text-xs text-gray-400">
              Step {stepIndex + 1} of {STEPS.length}
            </div>
          </div>

          {/* Step Navigation */}
          <ol className="flex flex-wrap gap-2 text-xs font-medium text-gray-400">
            {STEPS.map((label, index) => (
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

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
            <section className="space-y-4 rounded-2xl border border-merchant-gray bg-merchant-dark p-5 shadow-xl">
              {currentStep === "Business Profile" && (
                <BusinessProfileStep form={form} onChange={handleChange} />
              )}
              {currentStep === "Processing Info" && (
                <ProcessingStep form={form} onChange={handleChange} />
              )}
              {currentStep === "Review & Submit" && (
                <ReviewStep form={form} missingBySection={missingBySection} />
              )}

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between border-t border-merchant-gray/60 pt-4">
                <button
                  type="button"
                  className="rounded-xl border border-merchant-gray px-4 py-2 text-sm font-medium text-gray-200 hover:bg-merchant-gray/40 disabled:opacity-40"
                  onClick={() => setStepIndex(prev => Math.max(0, prev - 1))}
                  disabled={stepIndex === 0}
                >
                  ← Back
                </button>

                {stepIndex < STEPS.length - 1 ? (
                  <button
                    type="button"
                    className="rounded-xl bg-merchant-red px-4 py-2 text-sm font-semibold text-white shadow hover:bg-merchant-redLight"
                    onClick={() => setStepIndex(prev => Math.min(STEPS.length - 1, prev + 1))}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-xl bg-merchant-red px-4 py-2 text-sm font-semibold text-white shadow hover:bg-merchant-redLight disabled:bg-merchant-gray disabled:text-gray-500 flex items-center gap-2"
                    onClick={handleSubmit}
                    disabled={progress < 100 || isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Application
                      </>
                    )}
                  </button>
                )}
              </div>
            </section>

            {/* Sidebar */}
            <aside className="space-y-4">
              <div className="rounded-2xl border border-merchant-gray bg-merchant-dark p-4 shadow-xl">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldCheck className="w-4 h-4 text-merchant-redLight" />
                  Application Status
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Complete all required fields to submit your application.
                </p>

                <div className="mt-3 space-y-3 text-xs">
                  <SectionStatus
                    label="Business profile"
                    done={missingBySection.business.length === 0}
                    count={REQUIRED_FIELDS.business.length - missingBySection.business.length}
                    total={REQUIRED_FIELDS.business.length}
                  />
                  <SectionStatus
                    label="Processing info"
                    done={missingBySection.processing.length === 0}
                    count={REQUIRED_FIELDS.processing.length - missingBySection.processing.length}
                    total={REQUIRED_FIELDS.processing.length}
                  />
                </div>

                <OutstandingSummary progress={progress} missingBySection={missingBySection} />
              </div>

              <div className="rounded-2xl border border-merchant-gray bg-merchant-dark p-4 shadow-xl text-xs text-gray-300 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <BadgeCheck className="w-4 h-4 text-merchant-redLight" />
                  Why Apply?
                </div>
                <ul className="list-disc space-y-1 pl-4">
                  <li>Competitive processing rates</li>
                  <li>Fast approval turnaround</li>
                  <li>Dedicated support team</li>
                  <li>Next-day funding available</li>
                </ul>
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

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-merchant-gray bg-merchant-black px-3 py-2 text-sm text-white shadow-sm focus:border-merchant-red focus:outline-none focus:ring-2 focus:ring-merchant-red/40 min-h-[80px]",
        props.className
      )}
    />
  );
}

function SectionStatus({ label, done, count, total }: { label: string; done: boolean; count: number; total: number }) {
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

function OutstandingSummary({ progress, missingBySection }: { progress: number; missingBySection: Record<SectionKey, string[]> }) {
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
                <span className="font-medium capitalize text-white">{section}:</span> {fields.length} field{fields.length > 1 ? "s" : ""} remaining
              </li>
            ) : null
          )}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step Components
// ─────────────────────────────────────────────────────────────────────────────

function BusinessProfileStep({ form, onChange }: { form: MerchantForm; onChange: <K extends keyof MerchantForm>(field: K, value: MerchantForm[K]) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Users className="w-4 h-4 text-merchant-redLight" />
        Business Profile
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="DBA name (doing business as)" required>
          <Input
            value={form.dbaName}
            onChange={e => onChange("dbaName", e.target.value)}
            placeholder="Your business name"
          />
        </Field>
        <Field label="Describe products / services" required>
          <Input
            value={form.products}
            onChange={e => onChange("products", e.target.value)}
            placeholder="What do you sell?"
          />
        </Field>
        <Field label="Nature of business" required>
          <Input
            value={form.natureOfBusiness}
            onChange={e => onChange("natureOfBusiness", e.target.value)}
            placeholder="e.g. Retail, eCommerce, Restaurant"
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Contact first name" required>
          <Input
            value={form.contactFirst}
            onChange={e => onChange("contactFirst", e.target.value)}
          />
        </Field>
        <Field label="Contact last name" required>
          <Input
            value={form.contactLast}
            onChange={e => onChange("contactLast", e.target.value)}
          />
        </Field>
        <Field label="Phone" required>
          <Input
            value={form.phone}
            onChange={e => onChange("phone", e.target.value)}
            placeholder="+1 (555) 555-5555"
          />
        </Field>
        <Field label="Email" required>
          <Input
            type="email"
            value={form.email}
            onChange={e => onChange("email", e.target.value)}
            placeholder="you@company.com"
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Address" required>
          <Input
            value={form.address}
            onChange={e => onChange("address", e.target.value)}
          />
        </Field>
        <Field label="Address line 2">
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
        <Field label="State / Province" required>
          <Input
            value={form.state}
            onChange={e => onChange("state", e.target.value)}
          />
        </Field>
        <Field label="ZIP / Postal" required>
          <Input
            value={form.zip}
            onChange={e => onChange("zip", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function ProcessingStep({ form, onChange }: { form: MerchantForm; onChange: <K extends keyof MerchantForm>(field: K, value: MerchantForm[K]) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <CheckCircle2 className="w-4 h-4 text-merchant-redLight" />
        Processing Information
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Monthly volume ($)" required hint="Estimated monthly credit card sales">
          <NumberInput
            value={form.monthlyVolume}
            onChange={e => onChange("monthlyVolume", e.target.value)}
            placeholder="50000"
          />
        </Field>
        <Field label="Average ticket ($)" required hint="Average transaction amount">
          <NumberInput
            value={form.avgTicket}
            onChange={e => onChange("avgTicket", e.target.value)}
            placeholder="75"
          />
        </Field>
        <Field label="High ticket ($)" required hint="Largest expected transaction">
          <NumberInput
            value={form.highTicket}
            onChange={e => onChange("highTicket", e.target.value)}
            placeholder="500"
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Business type" hint="e.g. LLC, Corporation, Sole Proprietor">
          <Input
            value={form.businessType}
            onChange={e => onChange("businessType", e.target.value)}
            placeholder="LLC"
          />
        </Field>
        <Field label="Website" hint="Optional - your business website">
          <Input
            value={form.website}
            onChange={e => onChange("website", e.target.value)}
            placeholder="https://yourbusiness.com"
          />
        </Field>
      </div>

      <Field label="Additional notes" hint="Any other information you'd like us to know">
        <Textarea
          value={form.notes}
          onChange={e => onChange("notes", e.target.value)}
          placeholder="Tell us more about your business..."
        />
      </Field>
    </div>
  );
}

function ReviewStep({ form, missingBySection }: { form: MerchantForm; missingBySection: Record<SectionKey, string[]> }) {
  const allComplete = missingBySection.business.length === 0 && missingBySection.processing.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Send className="w-4 h-4 text-merchant-redLight" />
        Review & Submit
      </div>

      {!allComplete && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-300">
          Please complete all required fields before submitting.
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded-xl border border-merchant-gray bg-merchant-black p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Business Information</h3>
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

        <div className="rounded-xl border border-merchant-gray bg-merchant-black p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Processing Information</h3>
          <dl className="grid gap-2 text-sm md:grid-cols-3">
            <DataItem label="Monthly Volume" value={form.monthlyVolume ? `$${form.monthlyVolume}` : ""} />
            <DataItem label="Average Ticket" value={form.avgTicket ? `$${form.avgTicket}` : ""} />
            <DataItem label="High Ticket" value={form.highTicket ? `$${form.highTicket}` : ""} />
            <DataItem label="Business Type" value={form.businessType} />
            <DataItem label="Website" value={form.website} />
          </dl>
          {form.notes && (
            <div className="mt-3 pt-3 border-t border-merchant-gray/50">
              <span className="text-xs text-gray-400">Additional Notes:</span>
              <p className="text-gray-200 mt-1">{form.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-gray-200">{value || <span className="text-gray-500 italic">Not provided</span>}</dd>
    </div>
  );
}
