# Design System — SheStays Community

## 1. Design tokens (as provided — source of truth)
```css
:root {
  /* Brand */
  --color-primary: #F82A78;
  --color-primary-hover: #E91E63;
  --color-primary-soft: #FCE4EC;

  /* Text */
  --color-text-heading: #081828;
  --color-text-body: #334155;
  --color-text-muted: #64748B;

  /* Surfaces */
  --color-background: #FAF9F7;
  --color-surface: #FFFFFF;
  --color-surface-soft: #F0E9EF;
  --color-border: #E8D8D8;

  /* Brand decoration */
  --color-blush: #E8D8D8;
}
```
Add semantic tokens the app will also need (kept consistent with the palette above):
```css
:root {
  --color-success: #22C55E;   /* upvote/verified state */
  --color-danger: #EF4444;    /* downvote/report/error */
  --color-warning: #F59E0B;   /* flagged content */
  --color-anonymous: #475569; /* neutral gray used specifically for "Anonymous" tags — never the brand pink, so anonymous posts read as deliberately neutral, not decorated. Darkened from the originally proposed #64748B, which was borderline for WCAG AA at the small/medium-weight sizes this label is used at (see PRD review) */
}
```

## 2. Reference UI (from uploaded screens)
The uploaded screens (booking-app style: home feed with category pills, listing card with rating/beds/price, detail page with gallery and amenities) set the **layout language** to reuse, adapted to a community/review product instead of a booking one:
- Home screen pattern → becomes the **Discover feed**: greeting header, category/filter pills (swap "Villa/Apartment/Hotel" for area filters like "OMR / Nungambakkam / Velachery / All"), card list below.
- Listing card pattern → becomes the **PG place-page card**: PG name, area, aggregate rating, member/review count badge, small tag chips (Safety / Food / Wifi) instead of beds/baths.
- Detail page pattern (gallery, sticky bottom price bar) → becomes the **PG place page**: header photo/area, description, amenity chips, then the **feed of posts** where "Book Now" was — sticky bottom bar becomes "Write a Review" / "Join Community" instead.
- Rounded-pill category filters, soft card shadows, and the pill-shaped primary button are carried through directly — they match the brand's rounded, soft, non-corporate feel and suit --color-primary well.

## 3. Typography
- Headings: a clean geometric sans (Inter or Manrope) at 600–700 weight, color `--color-text-heading`.
- Body: same family at 400–500 weight, color `--color-text-body`.
- Muted/meta text (timestamps, counts): `--color-text-muted`, smaller size (13–14px).
- Anonymous author tags: use `--color-anonymous`, medium weight, slightly smaller than a real display name, with a small icon (mask/incognito glyph) so anonymity is visually obvious at a glance without needing to read the label.

## 4. Core components to build
- **PostCard**: vote column (up/down, count) + content (title/body, tags, comment count, author-or-anonymous tag, timestamp) + save/report overflow menu.
- **VoteControl**: vertical up/down arrows, active state uses `--color-primary`, count in `--color-text-body`.
- **AnonymousToggle**: pill switch on the compose screen, clearly labeled "Post as [Name]" vs "Post as Anonymous," with a one-line explainer ("Your identity is never shown, but our team can still act on reports").
- **PGCard**: used in search/discover — image, name, area, rating stars, member count, top tag chips. Rounded corners (16–20px radius) and soft shadow, matching the reference screenshots.
- **RatingTagChip**: small rounded chip per category (Safety, Food, Wifi, Warden, Curfew) with a mini 1–5 indicator, used both when composing a structured review and when displaying aggregate PG stats.
- **CommentThread**: nested replies with a visible left indent/rail, same author-or-anonymous treatment as PostCard.
- **FilterPillBar**: horizontally scrollable on mobile, wraps to a static row on desktop — reused for area filters and for tag/hashtag browse.
- **ReportModal**: reason list (harassment, fake review, doxxing, spam, other) + optional detail field.

## 5. Layout: mobile vs desktop
- **Mobile (base, matches reference screens)**: single column, bottom tab bar (Home / Search / Saved / Profile — swap the reference's heart/person icons to match: Home, Search, Notifications, Profile), full-width cards, sticky compose FAB (pink, `--color-primary`) bottom-right on feed screens.
- **Desktop (≥1024px)**: three-column layout — left: persistent sidebar nav (Home, Search, Saved PGs, joined communities list); center: feed/content, capped at ~680px reading width for comfortable line length; right: contextual sidebar (trending PGs, PG stats/tags when on a place page, community guidelines reminder near the compose action). No bottom tab bar on desktop — nav lives in the left sidebar/top bar instead.
- Both breakpoints share the same component set and tokens; only layout composition changes, so components should be built container-agnostic (no hardcoded viewport widths inside components).

## 6. Tone/feel
- Soft, warm, non-corporate — rounded corners throughout (cards 16–20px, buttons full-pill), generous whitespace, `--color-background` (warm off-white) rather than stark white behind content, `--color-surface` for cards.
- Primary pink used sparingly and intentionally: primary actions, active states, and the brand accent — not as a background flood — so it reads premium rather than loud.
- Anonymous elements deliberately desaturated (gray, not pink) so the product visually signals "safe, neutral, judgment-free" at the exact moment someone chooses to speak freely.
