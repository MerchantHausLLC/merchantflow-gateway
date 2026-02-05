

# Public Merchant Application Wizard + Web Submissions System

## Overview

Create a public-facing merchant application wizard that exactly matches your existing PreboardingWizard design (dark theme, step navigation, field styling, progress tracking), submits to the `applications` table, and provides a shareable URL for embedding on merchanthaus.io.

## What Will Be Built

### 1. Fix Build Error in WebSubmissions.tsx (Critical)

The current build is failing because `WebSubmissions.tsx` references a non-existent `merchant_applications` table. This needs to be changed to `applications`.

### 2. Public Merchant Application Wizard (`/merchant-apply`)

A wizard-style form matching the PreboardingWizard design exactly:

**Design Elements (matching PreboardingWizard):**
- Dark theme with `merchant-dark`, `merchant-black`, `merchant-gray`, `merchant-red` colors
- Step navigation pills with numbered indicators
- Card layouts with `rounded-2xl border border-merchant-gray bg-merchant-dark`
- Custom `Field`, `Input`, `NumberInput` components
- Status Snapshot sidebar with section progress bars
- Progress percentage in header

**Wizard Steps (simplified for public):**

| Step | Fields |
|------|--------|
| 1. Business Profile | DBA Name, Products/Services, Nature of Business, Contact (First, Last, Phone, Email), Location (Address, City, State, ZIP) |
| 2. Processing Info | Monthly Volume, Average Ticket, High Ticket, Business Type, Website (optional), Additional Notes |
| 3. Review & Submit | Summary of all entered data, Submit button |

**Key Differences from Internal Wizard:**
- 3 steps instead of 5 (no Legal Entity or Documents for public form)
- No authentication required - fully public route
- No "attach to account" dropdown - creates new application directly
- Success confirmation screen after submission
- Submits to `applications` table with status = 'pending'

### 3. Enhanced Web Submissions Dashboard

Update the existing page to:
- Query the correct `applications` table (fixes build error)
- Display all submissions with status badges (pending, reviewed, approved, rejected)
- Show key details: company name, contact info, monthly volume, submission date
- **"Convert to Pipeline" button** that creates Account + Contact + Opportunity
- Archive/reject functionality

### 4. Shareable Preview URL

The public wizard will be accessible at:
```
https://id-preview--d4e766df-1ab4-4f95-a16a-4c8c4222778a.lovable.app/merchant-apply
```

Once published, it will be available at your published domain.

---

## Technical Details

### Files to Create

| File | Description |
|------|-------------|
| `src/pages/MerchantApply.tsx` | Public wizard matching PreboardingWizard design - dark theme, step nav, progress sidebar |

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add public route `/merchant-apply` (outside ProtectedRoute wrapper) |
| `src/pages/WebSubmissions.tsx` | Change `merchant_applications` → `applications`, add convert-to-pipeline logic |

### No Database Changes Required

The existing `applications` table has all needed fields:
- `full_name`, `email`, `phone` - contact info
- `company_name`, `business_type` - business info
- `monthly_volume`, `message` - processing info
- `status` - workflow state (pending/reviewed/approved/rejected)

RLS policies already support:
- Public INSERT (anyone can submit)
- Authenticated SELECT (staff can view all)
- Admin UPDATE/DELETE (for status changes)

### Design Implementation

The public wizard will use the same styling patterns from PreboardingWizard:

```text
Colors:
├── bg-merchant-black    → Main background
├── bg-merchant-dark     → Card backgrounds
├── border-merchant-gray → Borders
├── bg-merchant-red      → Primary buttons
├── text-merchant-redLight → Accent text, required asterisks

Components:
├── Field → Label with required asterisk, hint text
├── Input → Dark themed input with red focus ring
├── SectionStatus → Progress bar per section
├── Step pills → Numbered navigation with active states
```

### Convert to Pipeline Flow

When "Convert to Pipeline" is clicked on a submission:

```text
1. Create Account
   └─ name = company_name
   └─ status = 'active'

2. Create Contact
   └─ first_name, last_name = split full_name
   └─ email, phone from application
   └─ account_id = new account ID

3. Create Opportunity
   └─ account_id = new account ID
   └─ contact_id = new contact ID
   └─ stage = 'application_started'

4. Update Application
   └─ status = 'approved'
```

---

## Mobile & Compliance

- **Responsive**: Grid layouts collapse on mobile, touch-friendly input sizes
- **Accessible**: Proper labels, focus states, required field indicators
- **No external dependencies**: All data stays in your Lovable Cloud database

