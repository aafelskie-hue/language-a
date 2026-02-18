# Category Planner — Implementation Spec

## INSTRUCTIONS FOR CLAUDE CODE

Build a CLI tool that analyzes the existing Language A patterns, identifies gaps, and produces a complete 254-pattern catalog plan — every slot titled, briefed, categorized, and assigned a scale — before a single new pattern is drafted. This is the strategic map. Nothing gets written without it.

The tool runs in two modes:

1. **Analyze** — reads the existing patterns, reports on scale distribution, category coverage, network density, and gaps.
2. **Plan** — using the analysis plus Andrew's editorial direction, proposes the full 254-pattern catalog as titled slots with one-line briefs.

The output is a structured JSON file (`catalog-plan.json`) and a human-readable markdown report. Andrew reviews and edits the plan. Only then does the Pattern Generator start drafting.

---

## Why This Exists

Writing 221 new patterns without a map produces chaos: duplicate coverage, scale imbalances, orphan patterns with no network connections, and categories that bloat while others starve. Alexander planned his 253 as an integrated whole — the patterns at the top (towns) created the context for patterns in the middle (buildings), which created the context for patterns at the bottom (construction). That vertical coherence is what makes it a *language* and not a *list*.

The Category Planner ensures Language A has the same structural integrity at 254 patterns that Alexander achieved at 253.

---

## Architecture

```
language-a/
├── tools/
│   ├── red-team/                    # Already built
│   ├── research-verify/             # Being built
│   ├── category-planner/
│   │   ├── planner.ts               # Main CLI entry point
│   │   ├── analyzer.ts              # Analyze existing patterns
│   │   ├── proposer.ts              # Propose new pattern slots
│   │   ├── prompt.ts                # System prompts
│   │   ├── formatter.ts             # Terminal + markdown output
│   │   ├── validator.ts             # Validate plan integrity
│   │   └── types.ts                 # TypeScript interfaces
│   └── tsconfig.json                # Shared
├── data/
│   ├── patterns.json                # Existing 33 patterns
│   └── catalog-plan.json            # OUTPUT: the full 254 plan
└── docs/
    └── catalog-plan.md              # OUTPUT: human-readable plan
```

### Dependencies

No new dependencies. Uses the same stack as Red Team.

---

## CLI Interface

```bash
# Analyze existing patterns — gap report only
npx tsx tools/category-planner/planner.ts --analyze

# Generate full 254-pattern plan
npx tsx tools/category-planner/planner.ts --plan

# Generate plan with specific constraints
npx tsx tools/category-planner/planner.ts --plan --min-per-category 15 --max-per-category 40

# Validate an existing plan file
npx tsx tools/category-planner/planner.ts --validate data/catalog-plan.json

# Show plan statistics
npx tsx tools/category-planner/planner.ts --stats data/catalog-plan.json

# Export plan as markdown
npx tsx tools/category-planner/planner.ts --export data/catalog-plan.json
```

---

## The Category Structure

Language A currently has 8 categories with 33 patterns. The vision document describes 10 categories. The target is 254 patterns across all categories.

### Existing Categories (from the 33 written patterns)

```
I.    Patterns for the Fifteen-Minute Life          — Neighborhood scale    — 4 patterns
II.   Patterns for Dwelling in the Digital Age      — Building scale        — 7 patterns
III.  Patterns for Housing Diversity                — Building/Neighborhood — 4 patterns
IV.   Patterns for Climate Resilience               — Building/Construction — 5 patterns
V.    Patterns for Energy and Envelope              — Building/Construction — 3 patterns
VI.   Patterns for Food and Water                   — Site/Building         — 3 patterns
VII.  Patterns for Adaptive Reuse                   — Building/Neighborhood — 3 patterns
VIII. Patterns for Health and Biophilia             — Building/Construction — 4 patterns
```

### Missing Categories (from vision document)

```
IX.   Patterns for Community Governance             — Neighborhood scale
X.    Patterns for Construction and Making          — Construction scale
```

### Scale Distribution Targets

Alexander's original 253 broke down approximately:
- Towns (1–94): 37%
- Buildings (95–204): 43%
- Construction (205–253): 19%

Language A should follow a similar distribution, adjusted for the three-scale vocabulary:

```
Neighborhood:  70–90 patterns  (28–35%)
Building:      110–130 patterns (43–51%)
Construction:  40–60 patterns  (16–24%)
```

The building scale is intentionally the largest — that's where most design decisions happen and where the patterns have the most direct spatial consequence.

---

## Analyze Mode

The analyzer reads `data/patterns.json` and produces a gap report.

### What It Measures

**1. Scale Distribution**
```
Current:
  Neighborhood:  6 patterns  (18%)  ← UNDERWEIGHT (target: 28-35%)
  Building:      22 patterns (67%)  ← OVERWEIGHT (target: 43-51%)
  Construction:  5 patterns  (15%)  ← ON TARGET (target: 16-24%)

To reach 254:
  Neighborhood needs: ~70 more patterns
  Building needs:     ~90 more patterns
  Construction needs: ~45 more patterns
```

**2. Category Coverage**
For each category:
- Number of existing patterns
- Estimated carrying capacity (how many patterns could this category reasonably hold?)
- Coverage gaps (subtopics mentioned in pattern bodies but not yet their own pattern)
- Cross-references to patterns that don't exist yet

**3. Network Health**
- Average connections per pattern (target: 4–6)
- Orphan patterns (fewer than 3 connections)
- Hub patterns (more than 8 connections — potential overload)
- Dead references (connections to pattern IDs that don't exist)
- Scale-crossing connections (neighborhood → building → construction flow)
- Network diameter and clustering

**4. Topic Gap Analysis**
The analyzer uses Claude to read all existing patterns and identify:
- Topics mentioned in pattern bodies that deserve their own pattern
- Topics from the vision document not yet covered
- Topics suggested by the editorial notes (e.g., "Community Governance" and "Construction and Making")
- Cold-climate topics specific to Edmonton that no other pattern language covers
- Cross-references to Alexander's originals that could become Language A patterns

### Analyze Output Format

```
═══════════════════════════════════════════════════════════
CATEGORY PLANNER — ANALYSIS
═══════════════════════════════════════════════════════════

SCALE DISTRIBUTION (current → target)
  Neighborhood:   6 → 80   ████░░░░░░░░░░░░░░░░░░░░░  8%
  Building:      22 → 120  ████████████████████░░░░░░  18%
  Construction:   5 → 54   █████░░░░░░░░░░░░░░░░░░░░░  9%

CATEGORY COVERAGE
  I.   Fifteen-Minute Life      4/25   ████░░░░░░░░░░░  16%
  II.  Digital Age Dwelling     7/30   ███████░░░░░░░░  23%
  III. Housing Diversity        4/25   ████░░░░░░░░░░░  16%
  IV.  Climate Resilience       5/30   █████░░░░░░░░░░  17%
  V.   Energy & Envelope        3/25   ███░░░░░░░░░░░░  12%
  VI.  Food & Water             3/20   ███░░░░░░░░░░░░  15%
  VII. Adaptive Reuse           3/20   ███░░░░░░░░░░░░  15%
  VIII.Health & Biophilia       4/25   ████░░░░░░░░░░░  16%
  IX.  Community Governance     0/25   ░░░░░░░░░░░░░░░   0%  ← EMPTY
  X.   Construction & Making    0/29   ░░░░░░░░░░░░░░░   0%  ← EMPTY

NETWORK HEALTH
  Average connections:    4.2 per pattern (target: 4-6) ✓
  Orphan patterns:        2 (< 3 connections)
  Hub patterns:           1 (> 8 connections)
  Dead references:        4 (connection targets don't exist)
  Scale-crossing rate:    62% of patterns connect across scales ✓

TOPIC GAPS DETECTED
  ⚠ 12 topics mentioned in existing patterns but not yet patterns:
    - Frost-protected foundations (referenced in 3 patterns)
    - Cross-ventilation (referenced in 4 patterns)
    - Thermal mass (referenced in 5 patterns)
    - Tool library / repair culture (referenced in 2 patterns)
    - Accessible pathway design (referenced in 3 patterns)
    ...

  ⚠ 8 cold-climate topics with no coverage:
    - Snow load design
    - Ice dam prevention
    - Heated walkway systems
    - Winter city public space
    ...

═══════════════════════════════════════════════════════════
```

---

## Plan Mode

The planner uses the analysis to propose all 254 pattern slots. It sends the analysis, the existing patterns, and the vision document context to Claude and asks it to fill every slot.

### Constraints for the AI Planner

The system prompt encodes these rules:

**1. Scale Balance**
Every category must contain patterns at multiple scales. A category that's all neighborhood-scale or all construction-scale is unbalanced. The language flows from large to small — each category should have at least some patterns at each scale.

**2. Network Density**
Every proposed pattern must specify at least 3 and no more than 8 connections to other patterns (both existing and proposed). Connections must be structural, not thematic. The planner must ensure:
- No orphans (every pattern connects to at least 3 others)
- Scale flow (neighborhood patterns connect down to building patterns, building connect down to construction)
- Cross-category connections (patterns should connect across categories, not just within)

**3. Vertical Coherence**
Alexander's language flows from the largest scale to the smallest: towns create the context for buildings, buildings create the context for construction details. Language A must have the same property. For every neighborhood-scale pattern, there should be building-scale patterns that implement it, and construction-scale patterns that detail the building patterns.

Example chain:
```
Neighborhood: The Fifteen-Minute Neighborhood
  → Building: The Corner Store (building type that serves the 15-min need)
    → Construction: The Shopfront Threshold (detail of how the store meets the street)
```

**4. Edmonton Specificity**
At least 15% of patterns should be specifically relevant to cold-climate, northern, or Edmonton-specific conditions. This is Language A's distinctive contribution — no other pattern language writes from -30°C. These patterns should be distributed across categories, not ghettoized into one.

**5. No Duplication with Alexander**
Language A patterns should not duplicate Alexander's originals. Where Alexander has a pattern (e.g., LIGHT ON TWO SIDES OF EVERY ROOM), Language A should not have a pattern covering the same ground. Language A can *reference* Alexander's patterns in its connections, but should not rewrite them. The 254 are meant to *extend* Alexander's 253, not replace them.

**6. Realistic Scope**
Each proposed pattern must be specific enough to be a real design move, not a broad category. "Sustainable Buildings" is not a pattern. "The Frost-Protected Shallow Foundation" is. The test: could you write a problem-tension-evidence-therefore for this title in 500–800 words?

### Plan Output Format

Each proposed pattern slot contains:

```typescript
interface PatternSlot {
  id: number;                        // 1–254 (first 33 already exist)
  name: string;                      // Pattern title
  scale: "neighborhood" | "building" | "construction";
  category: string;                  // Category ID
  status: "existing" | "planned";    // existing = already written
  brief: string;                     // One-line description of the pattern
  tension: string;                   // One sentence: the competing forces
  connections: number[];             // Proposed connections (IDs)
  coldClimate: boolean;              // Edmonton-specific relevance
  alexanderRef?: number[];           // Alexander pattern numbers this relates to
  priority: "high" | "medium" | "low";  // Writing priority
}
```

### Priority Assignment

Patterns are prioritized for drafting based on:

- **High:** Pattern is referenced by 3+ existing patterns (it's a gap in the network). Pattern fills an empty category. Pattern is a "foundation" pattern that many others will connect to.
- **Medium:** Pattern completes a vertical chain (neighborhood → building → construction). Pattern covers a topic from the vision document.
- **Low:** Pattern adds depth to an already-covered subtopic. Pattern is highly specialized.

The Pattern Generator should draft high-priority patterns first, since other patterns depend on them.

---

## System Prompt for Planning

```typescript
export function buildPlannerPrompt(
  existingPatterns: PatternInput[],
  analysis: AnalysisResult
): string {
  return `You are a pattern language architect planning the complete catalog for Language A — a collection of 254 design patterns for neighborhoods, buildings, and construction. Written from Edmonton, Alberta, grounded in forces that don't change: climate, light, gravity, human need for shelter and community.

## Your Task

You have ${existingPatterns.length} existing patterns. You need to propose ${254 - existingPatterns.length} more to complete the language. Every slot needs a title, a one-line brief, a one-sentence tension, proposed connections, and a priority level.

## The Existing Patterns

${existingPatterns.map(p => `${p.id}. ${p.name} [${p.scale}] — ${p.problem.slice(0, 100)}...`).join('\n')}

## Analysis of Current Gaps

${JSON.stringify(analysis, null, 2)}

## Category Structure

The language has 10 categories:

I.    Patterns for the Fifteen-Minute Life — Neighborhood scale
      How we organize daily living so everything is reachable.
      
II.   Patterns for Dwelling in the Digital Age — Building scale
      How work, rest, and technology coexist in our homes.
      
III.  Patterns for Housing Diversity — Building/Neighborhood scale
      The missing types between houses and towers.
      
IV.   Patterns for Climate Resilience — Building/Construction scale
      Designing for the climate we have, not the climate we had.
      
V.    Patterns for Energy and Envelope — Building/Construction scale
      The building as its own power plant and climate system.
      
VI.   Patterns for Food and Water — Site/Building scale
      Closing the loops between consumption and production.
      
VII.  Patterns for Adaptive Reuse — Building/Neighborhood scale
      Working with what exists rather than starting over.
      
VIII. Patterns for Health and Biophilia — Building/Construction scale
      The body in the building — sensory richness, air, sound, nature.
      
IX.   Patterns for Community Governance — Neighborhood scale
      How communities make decisions about shared resources.
      
X.    Patterns for Construction and Making — Construction scale
      Materials, repair culture, craft, and the act of building.

## Scale Targets

  Neighborhood:  70–90 patterns  (28–35%)
  Building:      110–130 patterns (43–51%)
  Construction:  40–60 patterns  (16–24%)

## Rules

1. SCALE BALANCE: Every category must have patterns at multiple scales. No single-scale categories.

2. NETWORK DENSITY: Every pattern must connect to 3–8 others. Connections must be structural (removing the connected pattern changes how this one works), not thematic (they're both about sustainability).

3. VERTICAL COHERENCE: For every neighborhood pattern, propose at least one building pattern that implements it, and one construction pattern that details the building pattern. The language must flow from large to small.

4. COLD CLIMATE: At least 15% of patterns must be specifically relevant to cold climate, northern conditions, or Edmonton. Distribute these across categories.

5. NO ALEXANDER DUPLICATES: Do not propose patterns that duplicate Alexander's originals. You may reference his patterns in connections (using his original numbers, e.g., "Alexander 159" for Light on Two Sides), but every Language A pattern must cover NEW ground.

6. REALISTIC SCOPE: Each pattern must be specific enough to generate a problem-tension-evidence-therefore in 500–800 words. "Sustainable Design" is too broad. "The Frost-Protected Shallow Foundation" is right.

7. NAMING: Pattern names should be concrete and evocative, like Alexander's. "Light on Two Sides of Every Room" not "Bilateral Fenestration Strategy." "The Fifteen-Minute Shed" not "Proximate Auxiliary Workspace."

8. EXISTING PATTERN IDs 1–33 ARE FIXED. Do not rename, recategorize, or modify existing patterns. New patterns are IDs 34–254.

## Output Format

Return a JSON array of pattern slots. Each slot:
{
  "id": number,
  "name": "Pattern Title",
  "scale": "neighborhood" | "building" | "construction",
  "category": "category-id",
  "status": "planned",
  "brief": "One line describing what this pattern is about",
  "tension": "When X, Y suffers because Z — the competing forces in one sentence",
  "connections": [list of pattern IDs this connects to],
  "coldClimate": true/false,
  "alexanderRef": [optional list of Alexander pattern numbers],
  "priority": "high" | "medium" | "low"
}

Include the existing 33 patterns with status "existing" so the full 254 is one document.

Think carefully about vertical coherence. For each neighborhood pattern, trace the chain: what building patterns implement it? What construction patterns detail those? Name specific connections.

Think carefully about the network. Every pattern should connect to at least 3 others. Draw the connections explicitly.

Think carefully about Edmonton. What patterns does a city at 53°N latitude, with -30°C winters and 17 hours of summer daylight, need that no one else has written?

Return ONLY the JSON array. No preamble, no commentary.`;
}
```

---

## Validator

The validator (`validator.ts`) checks the plan for structural integrity before Andrew reviews it.

### What It Checks

```typescript
interface ValidationReport {
  totalPatterns: number;                    // Must be exactly 254
  scaleDistribution: {
    neighborhood: number;
    building: number;
    construction: number;
    neighborhoodPct: number;               // Must be 28-35%
    buildingPct: number;                   // Must be 43-51%
    constructionPct: number;               // Must be 16-24%
  };
  categoryDistribution: {
    [categoryId: string]: {
      total: number;
      neighborhood: number;
      building: number;
      construction: number;
      hasMultipleScales: boolean;          // Must be true
    };
  };
  networkHealth: {
    orphans: number[];                     // Pattern IDs with < 3 connections
    overconnected: number[];               // Pattern IDs with > 8 connections
    deadReferences: { from: number; to: number }[];  // Connections to nonexistent IDs
    avgConnections: number;                // Target: 4-6
    scaleCrossingRate: number;             // % of patterns connecting across scales
  };
  verticalChains: {
    complete: number;                      // Neighborhood → Building → Construction chains
    broken: {                              // Chains with missing links
      neighborhood: number;
      missingBuilding: boolean;
      missingConstruction: boolean;
    }[];
  };
  coldClimateRate: number;                 // Must be >= 15%
  duplicateNames: string[];                // Must be empty
  emptyFields: { id: number; field: string }[];  // Must be empty
  
  verdict: "VALID" | "ISSUES" | "INVALID";
  issues: string[];
}
```

### Validation Output

```
═══════════════════════════════════════════════════════════
CATALOG PLAN VALIDATION
═══════════════════════════════════════════════════════════

TOTAL PATTERNS: 254 ✓

SCALE DISTRIBUTION:
  Neighborhood:  82 (32%)  ✓ target 28-35%
  Building:     118 (46%)  ✓ target 43-51%
  Construction:  54 (21%)  ✓ target 16-24%

CATEGORY BALANCE:
  I.   Fifteen-Minute Life     28 patterns  [N:12 B:11 C:5]  ✓
  II.  Digital Age Dwelling    30 patterns  [N:4  B:18 C:8]  ✓
  III. Housing Diversity       25 patterns  [N:8  B:14 C:3]  ✓
  IV.  Climate Resilience      30 patterns  [N:5  B:15 C:10] ✓
  V.   Energy & Envelope       25 patterns  [N:3  B:12 C:10] ✓
  VI.  Food & Water            20 patterns  [N:4  B:10 C:6]  ✓
  VII. Adaptive Reuse          22 patterns  [N:6  B:12 C:4]  ✓
  VIII.Health & Biophilia      25 patterns  [N:5  B:13 C:7]  ✓
  IX.  Community Governance    25 patterns  [N:18 B:5  C:2]  ✓
  X.   Construction & Making   24 patterns  [N:2  B:8  C:14] ✓

NETWORK HEALTH:
  Average connections:    4.8 per pattern  ✓
  Orphans (< 3):         0               ✓
  Overconnected (> 8):   2               ⚠ [#1, #22]
  Dead references:       0               ✓
  Scale-crossing:        71%             ✓

VERTICAL CHAINS:
  Complete chains:        62             ✓
  Broken chains:          3              ⚠

COLD CLIMATE:
  Cold-climate patterns:  41 (16%)       ✓ target ≥ 15%

ISSUES:
  ⚠ Patterns #1 and #22 have > 8 connections — consider splitting
  ⚠ 3 vertical chains have no construction-scale pattern

═══════════════════════════════════════════════════════════
VERDICT: VALID — plan is structurally sound
═══════════════════════════════════════════════════════════
```

---

## The Markdown Export

The `--export` flag produces a human-readable markdown document that Andrew reviews and edits before the Pattern Generator starts.

```markdown
# Language A — Complete Catalog Plan
## 254 Patterns for Enduring Places

Generated: 2026-02-14
Status: DRAFT — awaiting editorial review

---

### I. Patterns for the Fifteen-Minute Life
*Neighborhood scale — how we organize daily living*

| # | Name | Scale | Brief | Priority | Cold? |
|---|------|-------|-------|----------|-------|
| 01 | The Fifteen-Minute Neighborhood | N | ★ EXISTING | — | |
| 02 | The Third Place Network | N | ★ EXISTING | — | |
| 03 | Dark Sky Neighborhood | N | ★ EXISTING | — | |
| 04 | The Mobility Hub | N | ★ EXISTING | — | |
| 34 | The Winter Walking Network | N | Heated, sheltered, and cleared paths... | HIGH | ❄ |
| 35 | The Corner Store | B | The small commercial space that anchors... | HIGH | |
| 36 | The Neighborhood Workshop | B | A shared making space within walking... | MED | |
| 37 | The Shopfront Threshold | C | How the store meets the sidewalk... | MED | |
| ... | ... | ... | ... | ... | ... |

### II. Patterns for Dwelling in the Digital Age
*Building scale — how work, rest, and technology coexist*

[continues for all 10 categories]

---

### Network Statistics

- Total patterns: 254
- Scale: N=82 (32%) / B=118 (46%) / C=54 (21%)
- Cold-climate patterns: 41 (16%)
- Average connections: 4.8
- Vertical chains: 62 complete, 3 broken

### Priority Distribution

- HIGH: 45 patterns (write first — other patterns depend on these)
- MEDIUM: 120 patterns (fill the network)
- LOW: 56 patterns (depth and specialization)

### Writing Order

Phase 1 — Foundation (45 HIGH priority patterns)
Phase 2 — Network (120 MEDIUM priority patterns)
Phase 3 — Depth (56 LOW priority patterns)
```

---

## Implementation Order

1. **types.ts** — interfaces for slots, analysis, validation
2. **analyzer.ts** — read existing patterns, measure gaps
3. **prompt.ts** — system prompt for the AI planner
4. **proposer.ts** — call Claude to generate the full 254 plan
5. **validator.ts** — check plan structural integrity
6. **formatter.ts** — terminal and markdown output
7. **planner.ts** — main CLI entry point

---

## Validation Test

After building, run:

```bash
# Analyze current state
npx tsx tools/category-planner/planner.ts --analyze

# Generate plan
npx tsx tools/category-planner/planner.ts --plan

# Validate the generated plan
npx tsx tools/category-planner/planner.ts --validate data/catalog-plan.json

# Export for Andrew's review
npx tsx tools/category-planner/planner.ts --export data/catalog-plan.json
```

**Expected outcome:**
- Analysis shows the gaps we already know (empty categories IX and X, underweight neighborhood scale)
- Plan proposes 221 new patterns filling all gaps
- Validation passes with no INVALID verdict
- Markdown export is readable and editable

**Andrew's review process:**
1. Read the markdown export
2. Cross out patterns that don't belong
3. Rename patterns that need better titles
4. Add patterns the AI missed
5. Adjust priorities
6. Feed the edited plan back into the Pattern Generator

The plan is a living document. It changes as patterns are written and reviewed. But it exists before any drafting begins, so every pattern is written in the context of the whole language.

---

## What This Does NOT Do

- Does not write patterns. It maps slots. The Pattern Generator does the writing.
- Does not assign final IDs. Andrew may reorder after review.
- Does not guarantee quality. It guarantees *structure* — the quality comes from the Red Team and Research Verification gates downstream.
- Does not run automatically. Andrew triggers it, reviews the output, and edits before proceeding.
