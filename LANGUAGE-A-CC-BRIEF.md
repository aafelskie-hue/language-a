# Language A — Claude Code Build Brief

## INSTRUCTIONS FOR CLAUDE CODE

You are building a production-grade interactive web application for **Language A** — an original pattern language for contemporary living, published by Beachhead Systems.

This is NOT a companion to Christopher Alexander's "A Pattern Language." It is an independent product with original content, its own brand identity, and its own design system. Do not reference Alexander's book in the UI, design, or copy.

**Before writing any code:**
1. Read `LANGUAGE-A-FOUNDING-DOCUMENT.md` — the product's identity, data model, and roadmap
2. Read `LANGUAGE-A-100-PATTERNS.md` — the full content (100 patterns across 18 categories)
3. Open `language-a-brand.html` — the complete brand sheet with colors, typography, icon, lockups, and app preview
4. Study the Replit prototype in `a-pattern-language/Pattern-Language-Tool_Replit-Code/` for interaction patterns and layout ideas — but apply the NEW brand system, not the old palette
5. Present a plan: proposed project structure, build order, and key design decisions
6. Wait for approval before building

**Do not:**
- Reference Alexander, the original book, or the old project in any user-facing text
- Use the old v1 color palette (parchment, terracotta, sage, amber, slate)
- Use generic AI-looking design (no purple gradients, no Inter font, no cookie-cutter layouts)
- Over-engineer — ship features that work, not frameworks for features that might exist someday

---

## Project Context

**Owner:** Andrew — structural engineer and bridge inspector, Edmonton, Alberta.
**Company:** Beachhead Systems — parent brand for a family of products (BIM Inspector, OSIM Inspector, AE Canteen, Snacktab, Language A).
**Product:** Language A — an original pattern language for contemporary living. 100 interconnected design patterns across 18 categories and 3 scales.
**Goal:** Ship a production-quality app for corporate review by end of day. Beautiful, functional, convincing.

---

## Content Source

All pattern content is in `LANGUAGE-A-100-PATTERNS.md`. This file contains:
- 100 patterns numbered 1–100
- 18 categories organized across 3 scales (Neighborhood, Building, Construction)
- Each pattern has: number, name, confidence rating (★★/★/☆), upward connections, problem statement, evidence/body, solution ("therefore" statement), downward connections

**Your first task is to parse this markdown into structured JSON.** The data schema is below.

---

## The Content Structure

Language A contains 100 interconnected design patterns spanning three scales:

- **Neighborhood** (Patterns 1–4, 12–13, 21, 29, 40–44, 50–53, 58, 71–72, 75–79, 81, 87–89, 91–100): Community and street-scale patterns
- **Building** (Patterns 5–11, 14–19, 22–28, 30, 33, 34–39, 59–61, 63, 65–68, 70, 73–74, 80, 82, 85–86, 90): Building and site-scale patterns
- **Construction** (Patterns 20, 31–32, 45–49, 54–57, 62, 64, 69, 83–84): Detail, material, and construction-scale patterns

Each pattern follows a consistent format:
1. **Pattern number and name** with a confidence rating (0, 1, or 2 stars)
2. **Upward connections**: References to larger-scale patterns
3. **Problem statement** (bold text): The recurring design problem
4. **Body/evidence**: Discussion, research, reasoning
5. **Solution statement** (bold "Therefore:" text): The design principle
6. **Downward connections**: References to smaller-scale patterns

The connections between patterns form a network — this is the app's most powerful visualization feature.

### Categories

| # | Category | Scale | Patterns |
|---|----------|-------|----------|
| I | Fifteen-Minute Life | Neighborhood | 1–4 |
| II | Digital Age Dwelling | Building | 5–11 |
| III | Housing Diversity | Building + Neighborhood | 12–15 |
| IV | Climate Resilience | Building + Construction | 16–20 |
| V | Energy & Envelope | Building + Construction | 21–23 |
| VI | Food & Water | Site + Building | 24–26 |
| VII | Adaptive Reuse | Building + Neighborhood | 27–29 |
| VIII | Health & Biophilia | Building + Construction | 30–33 |
| IX | Community Governance | Neighborhood | 50–53 |
| X | Construction & Making | Construction | 54–57 |
| XI | Northern / Cold-Climate Living | All scales | 58–64 |
| XII | Water & Infrastructure | Building + Site | 65–70 |
| XIII | Children & Play | Neighborhood + Building | 71–76 |
| XIV | Aging & Accessibility | Neighborhood + Building | 77–81 |
| XV | Light & Darkness | Building + Construction | 82–86 |
| XVI | Sound & Silence | All scales | 87–90 |
| XVII | The Commons | Neighborhood | 91–95 |
| XVIII | Density Done Right | Neighborhood + Building | 96–100 |

Note: Patterns 34–49 are Foundation Patterns — core principles that sit across categories. Assign them to categories based on their primary scale.

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS custom properties (from brand sheet)
- **Visualization**: D3.js for the network graph
- **State Management**: Zustand
- **Data**: Static JSON file (`patterns.json`) — parsed from the 100-patterns markdown
- **Storage**: localStorage for user projects
- **Deployment**: Vercel
- **Fonts**: Google Fonts — DM Sans (400, 500, 600, 700), IBM Plex Mono (400, 500), Instrument Serif (italic, tagline only)

---

## Data Schema

```typescript
interface Pattern {
  id: number;                     // 1–100
  name: string;                   // e.g., "The Fifteen-Minute Shed"
  number: string;                 // Display number, e.g., "06"
  scale: "neighborhood" | "building" | "construction";
  category: string;               // e.g., "digital-age-dwelling"
  categoryLabel: string;          // e.g., "Patterns for Dwelling in the Digital Age"
  confidence: 0 | 1 | 2;         // 0 = ☆, 1 = ★, 2 = ★★
  status: "published" | "candidate" | "proposed";
  problem: string;                // The problem statement (bold paragraph)
  body: string;                   // Evidence/discussion (markdown)
  solution: string;               // The "therefore" statement (bold paragraph)
  connections_up: number[];       // Larger-scale pattern IDs
  connections_down: number[];     // Smaller-scale pattern IDs
  tags?: string[];                // e.g., ["cold-climate", "edmonton", "housing"]
}

interface Category {
  id: string;                     // e.g., "fifteen-minute-life"
  label: string;                  // e.g., "Patterns for the Fifteen-Minute Life"
  number: string;                 // Roman numeral, e.g., "I"
  scale: string;                  // e.g., "Neighborhood scale"
  description: string;            // One-line description
  patternIds: number[];           // Pattern IDs in this category
}
```

All 100 patterns are `status: "candidate"` for the initial release.

---

## Core Features to Ship

### 1. Pattern Explorer (Home Page)

- Browse all 100 patterns
- **Filter by scale**: Neighborhood / Building / Construction (toggle buttons)
- **Filter by category**: Dropdown or sidebar with all 18 categories
- **Filter by confidence**: ★★ / ★ / ☆
- **Full-text search**: Search pattern names, problems, and solutions
- **Grid view** (default): Card per pattern showing number, name, confidence, scale badge, first line of problem
- **List view**: Compact table with number, name, scale, category, confidence
- **Random pattern** button: Navigate to a random pattern detail page
- **Pattern count**: Show "Showing X of 100 patterns" with active filters

### 2. Pattern Detail Pages

Each pattern gets a dedicated page at `/patterns/[id]`.

- **Header**: Pattern number (large, copper, monospace), pattern name (DM Sans Bold), confidence stars, scale + category badges
- **Problem statement**: Highlighted block — copper left border, warm background tint
- **Evidence/body**: Clean reading typography, markdown rendered. This is the longest section.
- **Solution ("Therefore")**: Highlighted block, visually distinct from problem
- **Connections panel**: Two groups:
  - "This pattern is shaped by…" (connections_up) — clickable chips linking to larger-scale patterns
  - "This pattern gives form to…" (connections_down) — clickable chips linking to smaller-scale patterns
- **Sidebar or bottom**: "Other patterns in [category name]" — quick links to sibling patterns
- **Navigation**: Previous / Next pattern buttons. Breadcrumb: Home → Category → Pattern Name

### 3. Pattern Network Visualization

Interactive force-directed graph (D3.js) showing all 100 patterns as nodes, connections as edges.

**Node styling** — by scale:
  - Neighborhood = larger nodes
  - Building = medium nodes
  - Construction = smaller nodes
  - All nodes use the copper accent at varying opacity/saturation to create depth

**Node coloring** — dual mode:
  - **By scale**: Three shades differentiate neighborhood/building/construction
  - **By category**: 18 distinct but harmonious colors (generate from copper base + navy + neutrals)

**Interactions:**
  - Hover: Show pattern name tooltip
  - Click: Highlight the selected node + all directly connected nodes. Dim everything else. Show a detail panel (name, problem, confidence) with a "View full pattern" link.
  - Zoom/pan: Mouse wheel + drag
  - Filter: Toggle scale visibility. Toggle category visibility.
  - Search: Highlight matching nodes in the graph

**Layout:**
  - Force simulation should roughly cluster patterns by category
  - The graph should be beautiful at rest — not a tangled hairball
  - Start zoomed out to see the full network; zoom in to read names

**Technical notes:**
  - Lazy-load the D3 visualization (it's heavy)
  - Consider Canvas renderer if SVG is slow with 100 nodes + edges
  - Provide a static fallback (pattern list) for accessibility and screen readers

### 4. Project Builder

- **Create projects**: Named projects (e.g., "My House in Edmonton", "Office Retrofit")
- **Add patterns**: From any pattern detail page, click "Add to Project"
- **Smart suggestions**: When a pattern is added, suggest its connections ("You added The Fifteen-Minute Shed — consider also adding Building Envelope as Climate System and The Covered Connection")
- **Status tracking** per pattern: Not Started / Considering / Applied / Rejected
- **Notes field** per pattern: Free text for project-specific thoughts
- **Project overview**: Dashboard showing all added patterns, their status, and a mini network graph of just the project's patterns
- **Saved to localStorage**: Persists between sessions. Export as JSON for backup.

### 5. AI Pattern Guide

Chat interface for natural language queries about the patterns.

- **Anthropic API**: claude-sonnet-4-5-20250929 via Next.js API route (`/api/chat`)
- **System prompt**: See below
- **UI**: Chat panel accessible from a persistent button/tab. Conversation history within session.
- **Context-aware**: If the user has an active project, include the project's pattern list in the system prompt context
- **Pattern linking**: When the AI mentions a pattern by number/name, render it as a clickable link to the pattern detail page

**System Prompt:**
```
You are a design pattern consultant for Language A — a pattern language for contemporary living. You help people apply the 100 patterns to real design situations: new homes, renovations, neighborhood planning, climate-resilient building, and community development.

Language A was written from Edmonton, Alberta — a cold city where buildings are tested every January at -30°C. The patterns span three scales: Neighborhood, Building, and Construction.

When a user describes a project or design challenge:
1. Identify the most relevant patterns by number and name
2. Explain WHY each pattern applies to their specific situation
3. Suggest a sequence — start from neighborhood-scale patterns and work down to construction details
4. Reference connections between patterns to show how they reinforce each other
5. Be practical and specific, not abstract
6. For cold-climate projects, prioritize the Northern/Cold-Climate patterns (58–64) and the Energy & Envelope patterns (21–23)

You have access to all 100 patterns and their interconnections. Always reference patterns by their number and name (e.g., "Pattern 6: The Fifteen-Minute Shed").

Tone: Thoughtful, warm, practical. Like an experienced builder walking through a site with a friend.
```

---

## Brand & Design System

### The Brand

**Product name:** Language A
**Tagline:** A pattern language for contemporary living.
**Parent:** Beachhead Systems ("A Beachhead Systems Product" endorsement)
**Icon:** The Structural A — two angled strokes meeting at a peak with a horizontal tie. A roof truss and the letter A.

The complete brand sheet is in `language-a-brand.html`. Open it and match the visual system exactly.

### Color System

**Beachhead Foundation (inherited):**
```css
--navy-deep: #0F1F33;    /* Dark backgrounds, nav bars */
--navy: #1E3A5F;          /* Primary brand color */
--charcoal: #111827;      /* Text */
--cloud: #F3F4F6;         /* Light backgrounds */
--slate: #374151;         /* Secondary text */
--steel: #6B7280;         /* Tertiary text, metadata */
--silver: #9CA3AF;        /* Muted text, placeholders */
--white: #FFFFFF;
```

**Language A Accent — Copper:**
```css
--copper: #B5734A;        /* Primary accent */
--copper-light: #D4956A;  /* Hover states, light contexts */
--copper-dark: #8B5A3A;   /* Active states, dark contexts */
--copper-muted: #C49A7A;  /* Subtle accents */
--copper-pale: #F0E4DA;   /* Tinted backgrounds */
```

**App Surfaces:**
```css
--surface-warm: #FAF7F4;  /* Main app background */
--surface-card: #FFFFFF;  /* Cards, panels */
--surface-dark: #0F1F33;  /* Nav bar, dark sections */
```

### Typography

Three families, strict roles (per Beachhead brand guidelines):

| Family | Role | Weights |
|--------|------|---------|
| **DM Sans** | All public-facing UI: headlines, body, navigation, wordmark | 400 (body), 500 (medium), 600 (semi), 700 (bold) |
| **IBM Plex Mono** | Technical: pattern numbers, metadata, scale badges, tags, section labels | 400, 500 |
| **Instrument Serif** | Tagline only. *Never in product UI.* Italic only. | Italic |

**Specific type treatments:**
- Pattern names: DM Sans Bold, 28px, charcoal, letter-spacing -0.01em
- Pattern numbers: IBM Plex Mono 500, copper, uppercase
- Body text: DM Sans Regular, 15px, slate, line-height 1.75, max-width 640px
- Problem/solution blocks: DM Sans Semibold, 15px, charcoal, with copper left border and pale copper background
- Metadata/badges: IBM Plex Mono 400, 11px, uppercase, letter-spacing 0.08em
- Category section headers: IBM Plex Mono 500, 11px, copper, uppercase, letter-spacing 0.1em

### Layout Principles

- **Warm surface background** (#FAF7F4) for the main content area
- **Navy nav bar** (#0F1F33) across the top — inherited from Beachhead
- **Generous whitespace** — the content should breathe
- **Cards on white** (#FFFFFF) with subtle border (#E5E7EB), rounded corners (12px)
- **Sidebar navigation**: Categories grouped by scale (Neighborhood → Building → Construction), with pattern numbers in copper mono
- **No emojis in the UI** — use the mono type and copper color for visual hierarchy instead
- **Connection chips**: Small rounded pills showing connected pattern numbers, clickable

### Navigation

**Top nav bar** (navy):
- Language A logo (structural A icon + wordmark) — links home
- Pipe separator
- Nav links: Patterns (active default) | Network | Projects | Guide
- Nav links in IBM Plex Mono, uppercase, silver — active state in copper-light

**Sidebar** (on pattern explorer and detail pages):
- Scale sections: NEIGHBORHOOD / BUILDING / CONSTRUCTION
- Under each: category groups, then pattern list (number + name)
- Active pattern highlighted with copper-pale background
- Collapsible on mobile

### Endorsement Footer

Every page footer includes a small Beachhead Systems endorsement:
- Beachhead horizon mark (three bars) at reduced opacity
- "A Beachhead Systems Product" in IBM Plex Mono, 10px, steel color
- Centered, with generous top padding

---

## Project Structure

```
language-a/
├── app/
│   ├── layout.tsx                    # Root layout with nav, fonts, metadata
│   ├── page.tsx                      # Pattern Explorer (home)
│   ├── patterns/
│   │   └── [id]/
│   │       └── page.tsx              # Pattern detail page
│   ├── network/
│   │   └── page.tsx                  # Network visualization
│   ├── projects/
│   │   └── page.tsx                  # Project builder
│   ├── guide/
│   │   └── page.tsx                  # AI Pattern Guide
│   └── api/
│       └── chat/
│           └── route.ts              # Anthropic API proxy
├── components/
│   ├── layout/
│   │   ├── TopNav.tsx                # Navy nav bar with logo + links
│   │   ├── Sidebar.tsx               # Pattern sidebar navigation
│   │   ├── Footer.tsx                # Beachhead endorsement footer
│   │   └── MobileNav.tsx             # Responsive navigation
│   ├── patterns/
│   │   ├── PatternCard.tsx           # Grid view card
│   │   ├── PatternRow.tsx            # List view row
│   │   ├── PatternDetail.tsx         # Full pattern content
│   │   ├── ConnectionChip.tsx        # Clickable connection reference
│   │   ├── ConfidenceBadge.tsx       # Star rating display
│   │   ├── ScaleBadge.tsx            # Scale indicator
│   │   └── FilterBar.tsx             # Scale, category, confidence filters
│   ├── network/
│   │   ├── NetworkGraph.tsx          # D3 force-directed graph
│   │   ├── NetworkControls.tsx       # Filter/zoom controls
│   │   └── NodeDetail.tsx            # Click-to-reveal panel
│   ├── projects/
│   │   ├── ProjectList.tsx           # All projects
│   │   ├── ProjectDetail.tsx         # Single project view
│   │   ├── PatternStatusSelect.tsx   # Status dropdown
│   │   └── SuggestionPanel.tsx       # Related pattern suggestions
│   ├── guide/
│   │   ├── ChatInterface.tsx         # Chat UI
│   │   ├── ChatMessage.tsx           # Individual message
│   │   └── PatternLink.tsx           # Inline pattern reference
│   └── shared/
│       ├── Logo.tsx                  # Structural A icon + wordmark
│       ├── BeachheadMark.tsx         # Parent brand horizon mark
│       └── Search.tsx                # Global search component
├── data/
│   └── patterns.json                 # All 100 patterns (parsed from markdown)
├── lib/
│   ├── types.ts                      # TypeScript interfaces
│   ├── patterns.ts                   # Pattern data access helpers
│   └── network.ts                    # Graph data preparation for D3
├── store/
│   └── useProjectStore.ts            # Zustand store for projects
├── styles/
│   └── globals.css                   # CSS variables, Tailwind config
├── public/
│   ├── favicon.ico                   # Copper square with white structural A
│   └── og-image.png                  # Social sharing image
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Build Order

Build in this sequence. Each step should be complete and working before moving to the next.

### Step 1: Data Layer
1. Parse `LANGUAGE-A-100-PATTERNS.md` into `patterns.json`
2. Validate: 100 patterns, all connections resolve to valid IDs, all required fields present
3. Create TypeScript types and data access helpers

### Step 2: Layout Shell
1. Root layout with DM Sans / IBM Plex Mono / Instrument Serif fonts loaded
2. Top nav bar (navy, logo, navigation links)
3. Footer with Beachhead endorsement
4. CSS custom properties from brand sheet
5. Responsive foundation (mobile nav, sidebar collapse)

### Step 3: Pattern Explorer
1. Pattern grid view (default) with cards
2. Pattern list view
3. Filter bar: scale, category, confidence
4. Full-text search
5. Random pattern button
6. View toggle (grid/list)
7. Pattern count display

### Step 4: Pattern Detail Pages
1. Dynamic route `/patterns/[id]`
2. Full pattern content rendered with proper typography
3. Problem and solution blocks with copper styling
4. Connection chips (up and down) as clickable links
5. Sidebar showing category siblings
6. Previous/next navigation
7. Breadcrumb

### Step 5: Network Visualization
1. D3 force-directed graph with all 100 nodes
2. Edges from connection data
3. Node sizing by scale
4. Node coloring (by scale default, toggle to by category)
5. Click to highlight connections + detail panel
6. Zoom/pan
7. Filter by scale and category
8. Search to highlight nodes
9. Lazy-loaded

### Step 6: Project Builder
1. Create/delete projects (localStorage)
2. Add/remove patterns from project
3. Pattern status tracking
4. Notes per pattern
5. Smart suggestions (connected patterns)
6. Project dashboard with pattern list and statuses
7. Export project as JSON

### Step 7: AI Pattern Guide
1. Chat UI component
2. API route proxying to Anthropic (claude-sonnet-4-5-20250929)
3. System prompt with full pattern context
4. Pattern references rendered as clickable links
5. Project context injection (if active project)

---

## SEO & Meta

Each pattern should have its own URL with proper meta tags:

```
/patterns/6 → "The Fifteen-Minute Shed | Language A"
```

- **Title**: `{Pattern Name} | Language A`
- **Description**: First 160 characters of the problem statement
- **OG Image**: Shared Language A branded image (generate one with logo + tagline)

Home page:
- **Title**: `Language A — A Pattern Language for Contemporary Living`
- **Description**: `100 interconnected design patterns for neighborhoods, buildings, and construction details. Written from Edmonton, Alberta.`

---

## Accessibility

- Network visualization must have a keyboard-navigable alternative (the pattern list view)
- All interactive elements must be keyboard accessible
- Color contrast must meet WCAG AA (the copper palette is designed for this)
- Screen reader labels on all icons and badges
- Skip-to-content link on every page
- Proper heading hierarchy (h1 → h2 → h3)

---

## Performance

- Lazy-load the D3 network graph (it's the heaviest component)
- Static JSON data — no database, no API calls for pattern content
- Image optimization via Next.js Image component (if images are added later)
- Target: Lighthouse score 90+ on all metrics

---

## What NOT to Build

- No user accounts or authentication
- No server-side database
- No comments, voting, or community features (future phase)
- No pattern editing in the UI
- No admin panel
- No dark mode (the warm surface background is the brand — dark mode would contradict it)

---

## Reference Files

```
language-a/
├── a-pattern-language/                    # v1 reference (read-only, do not modify)
│   └── Pattern-Language-Tool_Replit-Code/  # Replit prototype for interaction reference
├── LANGUAGE-A-FOUNDING-DOCUMENT.md        # ⭐ Product identity and roadmap
├── LANGUAGE-A-100-PATTERNS.md             # ⭐ Full content — parse this into JSON
├── language-a-brand.html                  # ⭐ Complete brand sheet — match this exactly
└── LANGUAGE-A-CC-BRIEF.md                 # ⭐ THIS FILE — the master build brief
```

---

## First Prompt for Claude Code

Copy and paste this to get started:

```
Read LANGUAGE-A-CC-BRIEF.md — this is the master build brief for Language A.

Then read:
1. LANGUAGE-A-FOUNDING-DOCUMENT.md — product identity
2. LANGUAGE-A-100-PATTERNS.md — all 100 patterns (you'll parse this into JSON)
3. language-a-brand.html — the complete brand sheet (open it, study the colors, type, layout)
4. The Replit prototype in a-pattern-language/Pattern-Language-Tool_Replit-Code/ — for interaction patterns only (NOT the old brand)

Before writing any code, give me:
1. Your plan for parsing the 100 patterns markdown into structured JSON
2. Proposed project structure (confirm or adjust the one in the brief)
3. Build order and estimated step count
4. Any questions or concerns

Ship quality. Let's go.
```
