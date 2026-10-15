# SheStays Community UI Redesign

## Intent

Reshape the community experience using the uploaded screens as layout references: make the home feed feel active and legible, give surrounding discovery information a clear place, and keep the same experience comfortable on a phone. The social recognition feed is the closest reference because SheStays is also centered on community activity. The property dashboards inform how to group secondary information, not their property or finance content.

## Goals

- Make the home feed the clear focal point, with a visible post entry point and useful community context.
- Turn Search into an immediately useful PG discovery view with area filters, result summaries, and a selected community preview.
- Improve shared navigation and spacing across Home, Search, Notifications, Profile, PG pages, and post detail.
- Make mobile the baseline: single-column content, reachable actions, minimum 44px touch targets, safe room for bottom navigation, and no horizontal page overflow.
- Use the palette, Inter typography, neutral anonymous treatment, and responsive navigation already defined in `docs/DESIGN-SYSTEM.md`.
- Preserve routes, data behavior, and existing content actions.

## Non-goals

- Changing brand colors, typography, product vocabulary, or information architecture.
- Adding rewards, award points, payment/property-management UI, or new server behavior from the references.
- Replacing the existing app component library or data-fetching patterns.

## Visual direction

- Palette: SheStays pink `#F82A78`, heading ink `#081828`, body slate `#334155`, warm page background `#FAF9F7`, white surface `#FFFFFF`, and blush border `#E8D8D8`.
- Type: retain Inter for headings and body; use the existing heading/body/muted hierarchy.
- Shape: retain the existing rounded, welcoming SheStays language. Use the established radius scale by hierarchy; avoid making every element the same pill or card.
- Layout: a centered three-column desktop workspace with navigation and communities at left, a 680px reading-width activity stream in the center, and short discovery/context panels at right. On mobile, collapse to one column with the existing bottom tabs and compose action, and hide desktop-only sidebars.
- Home content: a concise welcome/location row; prominent, compact composer; horizontal content filters; activity cards; and contextual suggestions/trending at desktop. Keep the reference's information grouping while using SheStays content and actions.
- Responsive behavior: base styles target 320–390px, then expand at `min-width` breakpoints. Interactive controls remain at least 44px high. Respect reduced motion and visible focus styles.

### Layout sketches

Desktop uses the screenshot's clear dashboard grouping while keeping the feed central:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ SheStays       Home   Search   Notifications                 Search  Me │
├───────────────┬───────────────────────────────────┬─────────────────────┤
│ Your PGs      │ Your community                     │ Trending discussions│
│ Communities   │ [Share with your community…]       │ PGs for you         │
│ Saved posts   │ [All] [Reviews] [Discussions]      │                     │
│               │ [Post card                         │                     │
│               │  Post card …]                      │                     │
└───────────────┴───────────────────────────────────┴─────────────────────┘
```

Phone removes the rails and keeps the key actions in reach:

```text
┌──────────────────────┐
│ SheStays              │
├──────────────────────┤
│ Your community       │
│ [Share something…]   │
│ [All] [Reviews]  →   │
│ [Post card           │
│  Post card …]        │
│               [+]    │
├──────────────────────┤
│ Home Search Alerts Me│
└──────────────────────┘
```

Search uses a result list and a live detail panel on desktop; on a phone, selecting a result reveals its preview directly below that result:

```text
┌───────────────┬───────────────────────────────┬───────────────────────┐
│ Community nav │ Search + area filters         │ Selected PG preview   │
│               │ [Sunrise Ladies PG  4.6]      │ Category ratings      │
│               │ [Green Nest Hostel  4.4]      │ Members / reviews     │
│               │ [Velachery Ladies PG]         │ View / write review   │
└───────────────┴───────────────────────────────┴───────────────────────┘
```

## Constraints and calls

- `docs/DESIGN-SYSTEM.md` is the source of truth for brand tokens and soft rounded tone.
- Existing navigation routes and API/query behavior stay intact.
- Search uses existing discovery and search data; no new server or auth behavior is introduced.
- Implementation is limited to the shared shell, Home feed composition, Search discovery layout, and styling of reusable community surfaces required for visual consistency; backend and auth behavior are unchanged.
- No new dependencies or icon-library migration are required for this redesign.
- Design call: use the uploaded recognition feed as the strongest home-feed reference, and adapt the other screenshots' information grouping to SheStays rather than reproducing their product chrome.
