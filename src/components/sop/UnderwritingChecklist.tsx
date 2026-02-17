import { useState } from "react";
import { Copy, Check, AlertTriangle, XCircle, Shield, FileText, HelpCircle, CreditCard, Globe, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

const merchantMessage = `Hi! Before we submit your merchant application, underwriting will verify your website and details match the application and banking records.

Please confirm the following are live on your website (usually in the footer):
1) Refund/Return Policy (clear and easy to find)
2) Contact info (support email + phone)
3) Clear description of what you sell + pricing
4) Delivery/fulfillment timelines
5) Terms & Conditions + Privacy Policy
6) If you have subscriptions: clear recurring billing + cancellation instructions

Also please have these ready in case underwriting requests them:
- Voided check or bank letter (U.S. bank account)
- EIN letter (CP575/147C)
- Articles of Organization + Operating Agreement (if LLC)
- ID for the signer/owner
- Recent bank statements and/or processing statements (if applicable)

If anything on your website doesn't match what we submit (refund terms, products/services, delivery time, pricing), it can cause delays or a decline.`;

export function UnderwritingChecklist() {
  const [copied, setCopied] = useState(false);

  const copyMessage = () => {
    navigator.clipboard.writeText(merchantMessage);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="underwriting-checklist" className="bg-card rounded-xl border border-border shadow-sm p-8">
      <h2 className="text-2xl font-bold text-primary border-b-4 border-cyan-500 inline-block mb-6 pb-1">
        Pre-Underwriting Checklist
      </h2>
      <p className="text-muted-foreground mb-6 italic border-l-4 border-amber-500 pl-4 bg-amber-500/10 py-2 pr-2 rounded-r">
        Use this before submitting an application. Underwriters verify the application <strong className="text-foreground">matches</strong> the website, banking, and supporting documents.
        Getting these right reduces delays, follow-ups, reserves, and declines.
      </p>

      {/* Do this first callout */}
      <div className="mb-6 bg-amber-500/10 border border-amber-500/25 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-foreground mb-1">Do this first</p>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Everything must align:</strong> business name/DBA, products/services, pricing, refund terms, delivery timelines, and contact details.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* 1. Website Must-Haves */}
        <div className="bg-accent/30 rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-foreground">1. Website "Must-Haves"</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">Ecommerce + most sites</span>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong className="text-foreground">Refund / Return Policy</strong> visible and easy to find (footer link is best).</li>
            <li>• <strong className="text-foreground">Contact page</strong> with support email + phone (and address if possible).</li>
            <li>• <strong className="text-foreground">Clear product/service description</strong> (no vague "consulting" if you sell something else).</li>
            <li>• <strong className="text-foreground">Delivery / fulfillment timeline</strong> stated (shipping times, service scheduling, digital delivery).</li>
            <li>• <strong className="text-foreground">Terms & Conditions</strong> (especially for services, liability, chargebacks).</li>
            <li>• <strong className="text-foreground">Privacy Policy</strong> (especially if collecting customer info or running subscriptions).</li>
            <li>• <strong className="text-foreground">Pricing</strong> visible and consistent with the application's average ticket and volume.</li>
          </ul>
        </div>

        {/* 2. Red Flags */}
        <div className="bg-accent/30 rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-5 h-5 text-destructive" />
            <h3 className="font-bold text-foreground">2. Red Flags to Fix Before Submit</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">Decline triggers</span>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><span className="inline-block text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/25 mr-1">Fix</span> "Coming soon", placeholder site, or broken checkout/links.</li>
            <li><span className="inline-block text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/25 mr-1">Fix</span> Missing refund policy or "All sales final" (especially high-ticket).</li>
            <li><span className="inline-block text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/25 mr-1">Fix</span> No contact info (or only a form, no email/phone).</li>
            <li><span className="inline-block text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/25 mr-1">Fix</span> Products on site don't match what was declared on the application.</li>
            <li><span className="inline-block text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 mr-1">Review</span> Long delivery times (pre-orders, 30+ day fulfillment) → may trigger reserves.</li>
            <li><span className="inline-block text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 mr-1">Review</span> Aggressive claims (e.g., "guaranteed income", "get rich quick").</li>
            <li><span className="inline-block text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 mr-1">Review</span> Restricted content (adult, CBD, weapons, gambling, high-risk financial services, etc.).</li>
          </ul>
        </div>

        {/* 3. Subscriptions / Recurring */}
        <div className="bg-accent/30 rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-foreground">3. Subscriptions / Recurring Billing</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full border border-destructive/50 text-destructive">Critical</span>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong className="text-foreground">Clear recurring disclosure</strong>: billing frequency, amount range, and when charges occur.</li>
            <li>• <strong className="text-foreground">Cancellation instructions</strong>: how to cancel + how long it takes to stop billing.</li>
            <li>• <strong className="text-foreground">Trial terms</strong> explained: when trial ends and what happens next.</li>
            <li>• <strong className="text-foreground">Refund policy</strong> references subscription terms (prorated vs none, timelines).</li>
            <li>• <strong className="text-foreground">Descriptor support</strong>: a support email/phone that matches the statement descriptor.</li>
          </ul>
        </div>

        {/* 4. Application Alignment */}
        <div className="bg-accent/30 rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck className="w-5 h-5 text-green-400" />
            <h3 className="font-bold text-foreground">4. Application Alignment</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">UW compares this</span>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong className="text-foreground">Business name / DBA</strong> matches bank records + website branding.</li>
            <li>• <strong className="text-foreground">MCC / business type</strong> matches what's actually sold.</li>
            <li>• <strong className="text-foreground">Average ticket</strong>, <strong className="text-foreground">highest ticket</strong>, and <strong className="text-foreground">monthly volume</strong> reflect reality.</li>
            <li>• <strong className="text-foreground">Card-present vs ecommerce</strong> correctly indicated.</li>
            <li>• <strong className="text-foreground">Fulfillment timing</strong> accurate (same as website).</li>
            <li>• <strong className="text-foreground">Refund policy</strong> on app matches website.</li>
            <li>• <strong className="text-foreground">Ownership details</strong> complete and accurate (25%+ owners + control person).</li>
          </ul>
        </div>

        {/* 5. Documents Ready */}
        <div className="bg-accent/30 rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-foreground">5. Documents to Have Ready</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">Most commonly requested</span>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong className="text-foreground">Voided check</strong> or bank letter (U.S. bank account).</li>
            <li>• <strong className="text-foreground">EIN letter</strong> (CP 575) or IRS 147C.</li>
            <li>• <strong className="text-foreground">Articles of Organization</strong> (LLC) / Incorporation (Corp).</li>
            <li>• <strong className="text-foreground">Operating Agreement</strong> (LLC) — especially multi-member.</li>
            <li>• <strong className="text-foreground">Owner/Signer ID</strong> (driver's license/passport as applicable).</li>
            <li>• <strong className="text-foreground">3 months bank statements</strong> (often requested for newer merchants).</li>
            <li>• <strong className="text-foreground">Processing statements</strong> (last 3–6 months) if switching providers.</li>
          </ul>
        </div>

        {/* 6. Pre-Submit Questions */}
        <div className="bg-accent/30 rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-foreground">6. Pre-Submit Questions</h3>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">Ask the merchant</span>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• What exactly are you selling and how is it delivered?</li>
            <li>• What's your typical ticket size and highest ticket in the last 90 days?</li>
            <li>• What's your expected monthly volume for the next 3 months?</li>
            <li>• What's your refund policy and typical refund rate?</li>
            <li>• What's the fulfillment timeline (shipping / scheduling / digital delivery)?</li>
            <li>• Do you do subscriptions? If yes, how does cancellation work?</li>
            <li>• Any recent or expected spikes in volume (promos, launches, seasonality)?</li>
          </ul>
        </div>
      </div>

      {/* Copy/Paste Message */}
      <div className="mt-6 bg-accent/30 rounded-lg border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground">Copy/Paste Message to Merchant</h3>
          <button
            onClick={copyMessage}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-2">Send this to the merchant before you submit the application:</p>
        <pre className="whitespace-pre-wrap text-xs text-foreground/80 font-mono bg-background/50 rounded-md p-4 border border-border leading-relaxed">
          {merchantMessage}
        </pre>
      </div>

      {/* Tip */}
      <p className="mt-4 text-xs text-muted-foreground italic">
        Tip: If the merchant is brand new or has long fulfillment times, proactively share context (launch plan, fulfillment process, supplier details).
        Underwriting hates surprises more than they hate risk.
      </p>
    </section>
  );
}
