# Product Requirements Document — SheStays Community

## 1. One-line summary
A SaaS web app where women who are staying or have stayed at a PG (paying guest accommodation) can search for that PG, join or form a community around it, and post honest, optionally anonymous reviews and discussions — Reddit-style threads scoped to real places.

## 2. Problem statement
Women choosing a PG have almost no reliable, first-hand information. Listings (photos, amenities, price) don't tell you what it's actually like to live there — safety, warden behavior, food quality, curfews, roommates, landlord disputes. Existing review formats (star ratings, one-off comments) are shallow and reviewers hold back because their name is attached. There's no ongoing place to keep talking about a PG after the first review.

## 3. Target user
- Primary: Women aged 18–30, students or working professionals, searching for or currently living in a PG in an Indian metro (starting city: Chennai, per existing SheStays scope).
- Secondary (read-only / lurkers): Women researching a city before relocating.
- Out of scope for v1: PG owners/wardens as a user type (no owner accounts, no owner replies) — this keeps the space trustworthy and unmoderated by the party being reviewed.

## 4. Core product concept
Every PG is a **place page** (like a subreddit). Users:
1. Search for a PG by name/area/pincode.
2. If it exists → land on its community page (feed of posts, reviews, discussion).
3. If it doesn't exist → create it (becomes the founding member).
4. Post as their real profile name OR as **Anonymous** (per-post toggle, not per-account).
5. Others in that PG's community can reply, upvote/downvote, and react.

This is not a listings/booking product in v1 — no booking, no payment, no owner-side monetization. It is a trust and information layer that can later plug into the existing PG-finder/booking product (see `/areas/pg-finder.md` context — this is the community layer of the broader SheStays vision).

## 5. Key features (v1 / MVP)

### 5.1 PG Search & Place Pages
- Search by PG name, locality, or pincode (scoped to Chennai launch areas: OMR-Sholinganallur, Thoraipakkam, Nungambakkam, Velachery, Anna Nagar).
- Autocomplete + "can't find it? Add this PG" flow.
- Place page shows: PG name, area, aggregate rating (from reviews), member count, pinned info (address, if user-supplied), and the feed.

### 5.2 Community Feed (per PG)
- Reddit-style feed: posts sorted by New / Top / Most discussed.
- Post types: Review (structured — rating + tags like "Safety", "Food", "Warden", "Wifi", "Curfew" + free text), Discussion/Question, Poll.
- Threaded comments, upvote/downvote, save post.
- Users must have viewed/searched the PG or self-declare "I stayed here" / "I currently live here" to post a Review (soft honesty prompt, not hard-gated in v1 — see 5.5 for anti-abuse).

### 5.3 Anonymous posting
- Per-post toggle: "Post as [display name]" or "Post as Anonymous."
- Anonymous posts show a generated tag (e.g. "Anonymous Resident") not a persistent pseudonym, so anonymous posts cannot be linked to each other or to the account by other users.
- Internally, every post — anonymous or not — is still tied to the real account for moderation/abuse/legal purposes (see 5.5 and 9).
- Anonymity applies to identity only; content still goes through moderation.

### 5.4 Profiles
- Every user has a private real profile (name, city, optional PGs lived at) and a public display identity used on non-anonymous posts.
- Profile shows: their non-anonymous posts, saved PGs, joined communities. Anonymous posts never appear on any profile, public or private-facing-to-others.
- **Women-only signup (v1 decision, not open)**: self-attestation checkbox at signup + phone OTP verification (proves a real, single phone number controls the account; does not itself prove gender). This is a friction/trust trade-off, not a guarantee — it is the cheapest gate that deters casual bad actors while keeping signup low-friction. Stronger verification (ID/selfie-based) is explicitly deferred, not ruled out — revisit once the community has scale worth protecting and before any claim of "verified women-only" is made in marketing. Until then, product copy must describe this as "women-only community, phone-verified" and never imply identity verification it doesn't do.

### 5.4.1 Anonymity in notifications (critical — see §5.3)
The account owner obviously knows which posts are theirs, anonymous or not — the leak risk is not user-to-user, it's **surface-to-observer**: a push notification banner on a lock screen, or an email preview pane, can expose "you posted anonymously in PG X" to anyone glancing at the device or inbox, even though no other *user* of the app ever sees the link.
- Push/email notification previews for activity on an anonymous post must be generic ("New reply on one of your posts") — never include the PG name, post excerpt, or the word "Anonymous" in the externally-visible preview text.
- Full detail (which PG, what was said) is only ever rendered inside the authenticated in-app notification view.
- This applies to the in-app Notifications screen too: it must not place an anonymous post's real-identity link anywhere a screen-share, screenshot, or shoulder-surf could combine with another visible element (e.g. profile name shown in the same view) to imply authorship.

### 5.5 Trust & Safety (critical, given anonymity + real addresses)
- Report post/comment, block user.
- Rate limiting on new accounts before they can post (anti-brigading/fake review defense): accounts younger than 24 hours are capped at 3 posts/comments and 20 votes; accounts with fewer than 5 lifetime approved actions are capped at 10 posts/comments per rolling 24h regardless of age. Limits apply per-account (not per-anonymous-post, since anonymity is display-only — see §5.3) and are enforced server-side at write time, not just in the UI.
- Basic automated moderation (profanity/PII filter) + manual review queue for reported content.
- No PG-owner accounts in v1 → removes the single biggest source of pressure/retaliation risk.
- Clear community guidelines: no doxxing of individuals (wardens/roommates) by full name, no defamatory unverifiable claims presented as fact.
- This is a legally sensitive surface (reviews of real businesses/individuals, hosted anonymously). Flag for legal review before public launch — see §11.

### 5.6 Search & Discovery
- Browse by city → area → PG.
- Trending/most-discussed PGs this week.
- Tag-based browse (e.g. "#Safety concerns", "#Great food") across PGs, similar to hashtag communities already envisioned for SheStays.

## 6. Out of scope for v1
- Booking, payment, owner dashboards, owner replies to reviews.
- Direct messaging between users.
- Native mobile apps (web app, mobile-optimized, first).
- Cities beyond the existing Chennai launch areas.

## 7. Success metrics
- # of PG place pages created organically.
- # of reviews/posts per active PG (depth of community, not just breadth).
- % of posts made anonymously (signal that the safety promise is working).
- Week-4 retention of women who posted at least once.
- Report-to-resolution time for flagged content.

## 8. Information architecture (screens)
1. Home / Discover feed (trending PGs, recent activity) — mirrors the "Perfect Stay Today" home pattern from the reference UI, adapted to community activity instead of bookings.
2. Search results (PG list with rating, area, member/review count).
3. PG Place Page (feed + pinned info + join/follow).
4. Post detail / thread view.
5. Create post (review / discussion / poll) with anonymous toggle.
6. Profile (own + others' public view).
7. Notifications (replies, upvotes on your posts, mentions).
8. Report/Moderation flow (user-facing report modal).

## 9. Data & privacy notes
- Store real user identity server-side always; anonymity is a display-layer property, not a data-deletion property.
- Location data for "PG I lived at" claims should not be published verbatim if it could re-identify a small community (e.g. a 4-bed PG) — consider minimum-post threshold before a place page goes fully public.
- Data retention/deletion policy needed for account closure requests.

## 10. Phased roadmap
- **Phase 1 (MVP)**: Search, place pages, reviews + discussion posts, anonymous toggle, basic moderation, Chennai launch areas only.
- **Phase 2**: Notifications, tag/hashtag browse, trending, saved PGs, richer profile.
- **Phase 3**: Merge with PG-finder listings/booking product; verified-resident badges; owner-side read-only analytics (no posting rights).

## 11. Open decisions (need your input before build)
- Minimum reviews/members before a PG place page is publicly visible vs. private/seed state — v1 build default: a place page is visible to all once it has ≥3 distinct posting accounts OR ≥5 total reviews, whichever comes first; below that threshold it's visible only to members who've posted/joined, to avoid a 4-bed PG's second reviewer being trivially identifiable. Revisit this number once real usage data exists.
- Legal review of anonymous-review liability before public launch — recommend consulting someone on defamation/intermediary liability (IT Act / Section 79 safe harbor considerations in India) before this goes live with real PG names attached.

**Resolved during build (previously open):**
- Women-only signup enforcement → self-attestation + phone OTP for v1 (see §5.4).
- Anonymity leakage via notifications → generic external previews, full detail only in-app (see §5.4.1).
