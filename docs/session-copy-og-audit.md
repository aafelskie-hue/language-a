# Language A — Copy, OG Images & Audit Fixes — CC Session Brief

**Date:** April 3, 2026
**Prepared by:** Sylvie Marchetti, Thought Lead — Language A
**Purpose:** Deploy approved copy changes, build OG image generation, and address audit findings.
**Estimated effort:** 2–3 hours across two logical phases.

---

## Phase 1: Reconnaissance (15 min)

Before deploying any copy, verify two things:

### 1a. Free tier rate limit

Check the rate limiting logic in the codebase. Find the actual enforced limit for free-tier users on the AI Pattern Guide. Report:
- How many conversations per what time period (weekly? monthly?)
- Where this is configured (env var, constant, database?)
- What the gate prompt text currently says

The copy in Section 8 of the drafts document says "5 conversations per month." This must match what the system enforces. If it doesn't match, report the discrepancy — do not change the rate limiter, just tell me what it says.

### 1b. Check 404 behavior

Navigate to `language-a.com/patterns/999` and `language-a.com/nonexistent`. Report what renders. If it's a default Next.js error page, flag for a branded 404.

---

## Phase 2: Copy Deployment (45 min)

Deploy these approved copy changes. The full text for each is in the companion document `language-a-copy-drafts.md`.

### 2a. About Page — Full replacement

Replace the current About page content with the expanded version from Section 1 of the drafts. This includes:
- Opening paragraphs (Alexander → world changed → Language A)
- The Language (three scales with varied rhythm — Construction paragraph is deliberately different)
- 19 categories and 3,084 connections
- Confidence Ratings (★★ / ★ / ☆ with descriptions)
- The AI Pattern Guide section
- Methodology
- Editorial Voice (Sylvie bio)
- Contact (sylvie@ and hello@)
- Beachhead link: "Language A is built by Beachhead Systems, a domain intelligence company in Edmonton, Alberta." — linked to https://beachheadsystems.ca

Preserve the existing page layout/component structure. This is a content replacement, not a redesign.

### 2b. Guide Page — Header copy

Replace the subtitle/description text below "Pattern Guide" with:
> Your design partner for the pattern language. Describe what you're working on, explore any pattern, or bring a design challenge — the Guide works from the full text of every pattern it recommends and tells you where the language has gaps.

### 2c. Guide — Welcome message

Replace the welcome message body with:
> Describe your project, ask about any pattern, or bring a design challenge. I work from the full text of every pattern I recommend — I'll explain the forces at play, show how patterns connect, and tell you honestly where the language doesn't reach.

Update prompt suggestions to:
- How do I design a home office for cold climates?
- What patterns matter for a basement renovation?
- Tell me about Pattern 82: The Prospect and Refuge
- What are the key patterns for aging in place?

Input placeholder: "Describe your project or ask about patterns..."

### 2d. Guide Page — Meta tags

Set page-specific meta for /guide:
- Title: "AI Pattern Guide | Language A"
- Description: "A design partner that reads every pattern it recommends. Describe your project, explore the language, or ask what the patterns actually say."

These should override the default homepage meta, not fall back to it.

### 2e. Updates Log — April 2026 entry

Add a new entry at the top of the Updates page (above the January 2026 entry). Full text is in Section 5 of the drafts document. Heading: "APRIL 2026" with subheading "The Guide reads the patterns now."

### 2f. Homepage — AI Guide mention

In the "ABOUT LANGUAGE A" section on the homepage, add one sentence after the paragraph that describes the 254 patterns. The sentence:
> "Language A includes an AI-powered design partner that reads the full text of every pattern it recommends — describe your project and see how the patterns apply to your specific situation."

No other homepage changes.

---

## Phase 3: OG Image Generation (60 min)

Build dynamic Open Graph images for pattern pages using Next.js `next/og` (ImageResponse API).

### Route
`/api/og/pattern/[id]` — where [id] is the pattern's reading_order number.

### Layout (1200×630px)
- Background: warm cream (#faf7f4)
- Top left: "LANGUAGE A" in IBM Plex Mono (or system monospace fallback), uppercase, letter-spacing wide, copper (#b5734a)
- Center-left aligned:
  - Pattern number: large, light weight, charcoal (#2C2C2C)
  - Pattern name: medium size, bold
  - Scale badge: NEIGHBORHOOD / BUILDING / CONSTRUCTION in uppercase, small, with appropriate color:
    - Neighborhood: muted sage (#8B9E82)
    - Building: warm amber (#C49A3C)
    - Construction: slate (#6B7B8E)
  - Confidence stars (★★ / ★ / ☆)
- Bottom area: First sentence of the pattern's problem field, truncated with ellipsis at ~120 characters. Smaller text, slightly muted.

### Meta tag integration
Update the pattern detail page's metadata to include:
```
og:image = https://language-a.com/api/og/pattern/{reading_order}
twitter:image = https://language-a.com/api/og/pattern/{reading_order}
```

### Static OG images
For the homepage and Guide page, create a static branded image at `/public/og-default.png` (1200×630px) with:
- "LANGUAGE A" branding
- "254 design patterns for enduring places"
- Warm cream background, copper accent

Reference this in the homepage and Guide page meta tags.

---

## Phase 4: Audit Tasks (30 min)

### 4a. Pattern first-sentence preview audit

Extract the first sentence of every pattern's problem field. List any that:
- Exceed 150 characters (will truncate awkwardly on social cards)
- Start with a dependent clause or conjunction ("When...", "If...", "But...")
- Don't stand alone as preview text without additional context

Output as a report for editorial review — do not modify pattern content.

### 4b. Free vs. Workshop copy

**Only after Phase 1 confirms the rate limit number:** Add the "What's Free" and "What's in The Workshop" copy from Section 8 of the drafts to the appropriate location. Options:
- On the Guide page, below the header copy (preferred — this is where users encounter the limit)
- On the Workshop page, as additional context above the "Coming soon" section
- Both

Use the confirmed rate limit number, not the draft's placeholder "5 conversations per month."

---

## What This Does NOT Change

- The Guide's two-stage retrieval architecture (deployed earlier today)
- Rate limiting logic or tier enforcement
- Authentication
- Pattern content or data model
- Navigation structure
- The Workshop page (except possibly adding the free-vs-premium copy)
- The /consult page
- Pricing

---

## Validation

After deployment:
1. Visit /about — confirm all sections render, Beachhead link works, Sylvie bio appears
2. Visit /guide — confirm new header copy, welcome message, prompt suggestions, and meta tags
3. Visit /updates — confirm April 2026 entry appears above January 2026
4. Share a pattern URL in a private Slack/Discord channel or use opengraph.xyz — confirm OG image renders correctly
5. View page source on /guide — confirm unique title and description meta tags
6. Check homepage "About Language A" section — confirm AI Guide sentence is present
