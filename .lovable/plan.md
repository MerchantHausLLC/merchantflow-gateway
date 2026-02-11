

# Gold Ribbon Badge for Live Account Modals

## What Changes

When an opportunity is in the "Live" stage (`live_activated`), the detail modal will get a visual upgrade:

1. **Gold ribbon badge image** -- The uploaded ribbon/rosette image will be added to the project and displayed prominently on live account modals, positioned next to the business name in the header area.

2. **Stage Progress hidden for live accounts** -- Since live accounts don't need the stage progress tracker, that section will be removed when the opportunity is at `live_activated` stage. The ribbon badge will visually replace that space, draped over/across where the stage progress would normally sit.

3. **Placement** -- The ribbon will sit adjacent to the business name (right side of the title area), slightly overlapping or positioned where the Stage Progress section would be, creating a premium "certified live" visual.

---

## Technical Details

### File: Asset Copy
- Copy `user-uploads://hyper_realistic_badge_crm_optimized_1.webp` to `src/assets/live-badge.webp`

### File: `src/components/OpportunityDetailModal.tsx`

**Header changes (around line 604-627):**
- Import the badge image: `import liveBadge from "@/assets/live-badge.webp"`
- Detect if live: `const isLiveAccount = opportunity.stage === 'live_activated'`
- Add the ribbon image next to the business name when live, sized ~48-56px tall, with a subtle drop shadow and slight rotation for a natural drape effect

**Stage Progress section (around lines 850-857):**
- Conditionally hide `StatusBlockerPanel` and `StagePath` when `isLiveAccount` is true
- In their place, show a centered gold-themed banner area with the ribbon badge image larger (~80px) and a "Live Account" label beneath it
- Apply a subtle gold gradient background to this replacement section for the premium feel

**Header styling for live accounts:**
- The existing `Building2` icon container gets a gold treatment when live (gold background instead of primary)
- The existing "Live" badge styling is preserved alongside the ribbon

