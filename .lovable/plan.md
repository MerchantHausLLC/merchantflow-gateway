
# Neo-Brutalism: Chat & Pipeline

## What is Neo-Brutalism (in this context)?

Neo-brutalism applied to a dark, professional CRM means:
- **Raw, hard edges** — no rounded corners, flat geometry
- **Heavy black offset box-shadows** — the hallmark "lifted block" effect
- **Bold, visible borders** — 2px solid borders instead of subtle outlines
- **Flat, high-contrast backgrounds** — no gradients or translucency in key structural elements
- **Stark typographic weight** — bold labels, no softening
- **Functional austerity** — minimal decoration but maximum visual impact

This will be applied while staying within the existing dark colour palette (haus-charcoal, primary red, teal, gold) so it remains coherent with the Merchant Haus Architectural Manifesto.

---

## Scope

### 1. FloatingChat (`src/components/FloatingChat.tsx`)

#### Launcher Button (closed state)
- Remove gradient and rounded-full (desktop bar)
- Apply hard rectangular shape with 2px border and 4px black offset shadow
- Bold uppercase "MESSAGING" label

#### Chat Panel Container
- Replace `rounded-t-xl` with `rounded-none`
- Remove backdrop/glass effects, use solid `bg-background`
- Replace `border-slate-200` with `border-2 border-foreground/80`
- Add `shadow-[4px_0px_0px_0px_rgba(0,0,0,1)]` brutalist lift effect

#### Header
- Remove gradient — use solid `bg-zinc-900` (haus-charcoal)
- Apply `border-b-2 border-foreground/60`
- Bold uppercase title

#### Message Bubbles (own messages)
- Replace `rounded-2xl rounded-br-md` with `rounded-none`
- Keep `bg-primary` (red) for own bubbles but add `border-2 border-primary shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)]`
- Replace `rounded-bl-md` with `rounded-none` for incoming, swap `bg-white/bg-slate-800` for `bg-secondary`, apply bold left border accent `border-l-4 border-teal`

#### Reply Preview
- Replace blue soft background with `border-l-4 border-primary bg-muted/40`
- Remove rounded corners

#### Input Area
- Replace `bg-white dark:bg-slate-800` with solid `bg-background`
- Swap `border-t border-slate-200` with `border-t-2 border-foreground/30`
- Input field: lean on existing underline style (already matches brutalism)
- Send button: square shape, `shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`

#### Contacts/Channels List
- Channel and contact rows: replace rounded hover with square hover, add `border-l-4 border-transparent hover:border-primary` left rail
- Section headers: already uppercase — increase weight + add `border-b border-foreground/20`

#### Date separators
- Replace `bg-slate-200` horizontal rules with solid single-pixel foreground lines
- Date label: bold, no pill shape — raw square badge

---

### 2. Pipeline (`src/components/PipelineColumn.tsx`, `src/components/OpportunityCard.tsx`, `src/components/DualPipelineBoard.tsx`)

#### PipelineSection Container (`DualPipelineBoard`)
- Replace `rounded-lg` with `rounded-none`
- Increase border from `border-border/40` to `border-2 border-foreground/40`
- Add `shadow-[4px_4px_0px_0px_rgba(0,0,0,0.6)]` offset shadow for lifted-block effect

#### Vertical Title Sidebar
- Already dark `bg-zinc-800` — add `border-r-2 border-foreground/40` and bump font to `font-black`
- Count badge: change from subtle `bg-white/20` to solid `bg-primary text-white border border-white/40` square pill

#### Stage Column Headers (`DualPipelineBoard` header row)
- Replace `border-b-2` with inline `borderBottom: '3px solid'`
- Stage label: add `font-black` uppercase
- Count: square badge with `border border-foreground/30`

#### PipelineColumn drop zone
- Empty state "Drop here": `border-2 border-dashed border-foreground/30` with `text-foreground/40 font-bold uppercase text-[8px] tracking-widest`

#### OpportunityCard
- Remove `rounded-none hover:shadow-md` (already no radius) — replace with static `shadow-[3px_3px_0px_0px_rgba(0,0,0,0.7)]`
- Active/hover state: `hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] hover:-translate-y-px`  for a "press-lift" feel
- Increase left border from `border-l-[3px]` to `border-l-[4px]` with stronger colour
- Account name: `font-black` instead of `font-semibold`
- Live card: keep gold treatment but add `shadow-[3px_3px_0px_0px_rgba(180,140,0,0.5)]`
- SLA badge: square `rounded-none` instead of `rounded`
- Add `border-b-2 border-foreground/10` to the card footer divider instead of `border-border/30`

#### Compact Toggle & Refresh bar
- Replace `variant="outline"` button with `border-2 border-foreground/60 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] font-bold` 

---

## Technical Approach

- **No new dependencies** — all changes are Tailwind class edits and inline style tweaks
- **Dark-mode coherent** — existing CSS variables are used throughout, no hardcoded colours
- **No layout changes** — sizes, widths, column counts remain identical
- **Preserves compliance** — no colour meaning changes (SLA red/amber/green, team colours remain)
- **Mobile-safe** — all responsive classes preserved, brutalism shadow reduced on mobile-landscape

## Files to Edit

1. `src/components/FloatingChat.tsx` — chat panel, launcher, bubbles, input area, contacts list
2. `src/components/OpportunityCard.tsx` — card shadow, borders, typography weight
3. `src/components/PipelineColumn.tsx` — drop zone, column wrapper
4. `src/components/DualPipelineBoard.tsx` — section container, sidebar, header row, toolbar buttons
