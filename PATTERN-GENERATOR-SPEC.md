# Pattern Generator — Implementation Spec

## INSTRUCTIONS FOR CLAUDE CODE

Build a CLI tool that drafts Language A patterns from catalog plan slots. This is the content engine — it takes a titled, briefed, connected slot from `catalog-plan.json` and produces a full pattern in Alexandrian format: problem statement → evidence → therefore → connections.

The generator does NOT publish patterns. It drafts them. Every draft goes through the quality pipeline:

```
Pattern Generator → Red Team → Research Verification → Andrew → Published
```

The generator's job is to produce drafts good enough that the quality gates catch real issues, not structural failures. A well-drafted pattern should pass Red Team on the first or second try. A poorly drafted pattern wastes everyone's time.

---

## Architecture

```
language-a/
├── tools/
│   ├── red-team/                    # Built — editorial review
│   ├── research-verify/             # Built — fact checking
│   ├── quality-gate.ts              # Built — combined wrapper
│   ├── category-planner/            # Built — catalog mapping
│   ├── pattern-generator/
│   │   ├── generate.ts              # Main CLI entry point
│   │   ├── drafter.ts               # Core drafting logic
│   │   ├── prompt.ts                # System prompts
│   │   ├── context.ts               # Gather context from neighboring patterns
│   │   ├── reviser.ts               # Revise draft based on Red Team feedback
│   │   ├── batch.ts                 # Batch generation
│   │   ├── formatter.ts             # Terminal output
│   │   └── types.ts                 # TypeScript interfaces
│   └── tsconfig.json                # Shared
├── data/
│   ├── patterns.json                # Existing published patterns
│   └── catalog-plan.json            # The 254-pattern plan
├── drafts/                          # OUTPUT: generated pattern drafts
│   ├── 034-winter-walking-network.md
│   ├── 035-the-corner-store.md
│   └── ...
└── patterns/                        # Approved patterns (post quality gate)
```

### Dependencies

No new dependencies. Uses the same stack as the other tools.

---

## CLI Interface

```bash
# Draft a single pattern from its catalog plan slot
npx tsx tools/pattern-generator/generate.ts --id 34

# Draft a single pattern with a custom brief (overrides catalog plan)
npx tsx tools/pattern-generator/generate.ts --id 34 --brief "Heated and sheltered pedestrian routes that keep a northern city walkable in winter"

# Draft with extra context from Andrew (appended to the prompt)
npx tsx tools/pattern-generator/generate.ts --id 34 --context "I've seen this done well in Oulu, Finland. Their heated walkways in the city center stay clear at -25C. Also look at Montreal's underground city as a counterexample — it works but kills street life."

# Batch generate all HIGH priority patterns
npx tsx tools/pattern-generator/generate.ts --batch --priority high

# Batch generate a specific category
npx tsx tools/pattern-generator/generate.ts --batch --category fifteen-minute-life

# Batch generate a range
npx tsx tools/pattern-generator/generate.ts --batch --from 34 --to 50

# Revise a draft based on Red Team feedback
npx tsx tools/pattern-generator/generate.ts --revise drafts/034-winter-walking-network.md --feedback "Red Team says: spatial specificity needs work. What does the heated walkway actually look like? Cross-section, materials, width, relationship to buildings."

# Draft and immediately run through quality gate
npx tsx tools/pattern-generator/generate.ts --id 34 --gate

# Generate with research mode (searches for real evidence before drafting)
npx tsx tools/pattern-generator/generate.ts --id 34 --research
```

---

## How It Works

### Step 1: Context Gathering

Before drafting, the generator assembles context from the catalog plan and existing patterns:

```typescript
interface GenerationContext {
  slot: PatternSlot;                    // From catalog-plan.json
  connectedPatterns: PatternInput[];    // Full text of connected patterns
  categoryPatterns: PatternInput[];     // Other patterns in same category
  scaleNeighbors: PatternInput[];       // Patterns at same scale
  verticalChain: {                      // The neighborhood → building → construction chain
    above: PatternSlot[];               // Larger-scale patterns in the chain
    below: PatternSlot[];               // Smaller-scale patterns in the chain
  };
  andrewContext?: string;               // Optional context from --context flag
  existingDraft?: string;               // For --revise mode
  redTeamFeedback?: string;             // For --revise mode
  research?: ResearchResult;
}
```

This context is critical. A pattern drafted in isolation will have generic connections and miss the network relationships that make it part of a language. By loading the connected patterns' full text, the generator can:
- Match the tone and depth of neighboring patterns
- Reference specific details from connected patterns
- Avoid duplicating content that's already in a connected pattern
- Get the connections right — structural, not thematic

### Step 2: Research (Optional)

When `--research` flag is set, the generator uses Claude with web search to find real evidence before drafting:

```typescript
interface ResearchResult {
  programs: { name: string; location: string; year: string; outcome: string; source: string }[];
  statistics: { claim: string; source: string; year: string }[];
  studies: { authors: string; title: string; year: string; finding: string }[];
  examples: { location: string; description: string; source: string }[];
}
```

The research prompt asks Claude to find:
- Real programs, policies, or initiatives related to the pattern's topic
- Specific statistics with sources and dates
- Academic studies or reports with named authors
- Built examples in real cities

This pre-research step dramatically reduces fabrication risk. The generator drafts from real evidence rather than generating plausible-sounding evidence from training data.

**This is the key quality lever.** Patterns drafted with `--research` will have verifiable evidence. Patterns drafted without it will rely on the model's training data and are more likely to contain fabricated citations. For high-priority patterns, always use `--research`.

### Step 3: Drafting

The generator sends the context (and research, if available) to Claude and receives a full pattern draft in markdown format.

### Step 4: Output

The draft is saved as a markdown file in `drafts/` with YAML frontmatter matching the pattern schema. The filename follows the convention: `{id:03d}-{slugified-name}.md`.

---

## System Prompt

```typescript
export function buildDraftingPrompt(context: GenerationContext): string {
  return `You are drafting a pattern for Language A — a collection of 254 design patterns for neighborhoods, buildings, and construction. Written from Edmonton, Alberta (53°N, -30°C winters, 17 hours of summer daylight). Grounded in forces that don't change.

## The Pattern You Are Writing

Title: ${context.slot.name}
ID: ${context.slot.id}
Scale: ${context.slot.scale}
Category: ${context.slot.categoryLabel}
Brief: ${context.slot.brief}
Tension: ${context.slot.tension}
Connections: ${context.slot.connections.join(', ')}
Cold-climate relevant: ${context.slot.coldClimate}
${context.slot.alexanderRef ? `Alexander references: ${context.slot.alexanderRef.join(', ')}` : ''}

## Connected Patterns (Full Text)

These are the patterns this one connects to. Read them carefully. Your pattern must fit structurally with these — the connections should be real dependencies, not thematic associations.

${context.connectedPatterns.map(p => `### ${p.id}. ${p.name} [${p.scale}]
Problem: ${p.problem}
Solution: ${p.solution}
`).join('\n')}

## Vertical Chain

${context.verticalChain.above.length > 0 ? `Larger-scale patterns this implements:
${context.verticalChain.above.map(s => `- ${s.id}. ${s.name} [${s.scale}]: ${s.brief}`).join('\n')}` : 'This is the largest-scale pattern in its chain.'}

${context.verticalChain.below.length > 0 ? `Smaller-scale patterns that detail this one:
${context.verticalChain.below.map(s => `- ${s.id}. ${s.name} [${s.scale}]: ${s.brief}`).join('\n')}` : 'This is the smallest-scale pattern in its chain.'}

${context.andrewContext ? `## Andrew's Notes\n\n${context.andrewContext}` : ''}

## How to Write a Pattern

Follow Christopher Alexander's format exactly:

### 1. Opening Connections (one line)
"…beyond [PATTERN A] (id), [PATTERN B] (id), and [PATTERN C] (id)…"
Name 2-4 larger-scale patterns that provide context for this one. Use patterns from Language A (IDs 1-254) and/or Alexander's originals (mark as "Alexander [number]").

### 2. Problem Statement (one bold paragraph)
State the design tension — TWO OR MORE FORCES IN CONFLICT. Not advocacy for a position. Not a conclusion. The reader should feel the pull of both sides.

Format: "When [condition], [force A] suffers because [force B] demands the opposite."

WRONG: "When cities don't invest in bike lanes, cyclists are unsafe." (advocacy)
RIGHT: "When daily needs require a car to reach, people spend hours in transit, neighborhoods lose their social fabric, and the elderly and young become dependent on those who can drive." (tension between access, independence, and community)

### 3. Evidence (2-4 paragraphs)
Build the case with SPECIFIC, VERIFIABLE evidence:
- Name the city, the year, the program, the measurement
- Cite the study, the author, the finding
- Give the number, the percentage, the cost
- Show where this has been built, tested, measured

NEVER use: "Research shows..." "Studies suggest..." "Experts agree..."
ALWAYS use: "Philadelphia's Green City program installed 2,800 greened acres..." "Ward et al. (2017) found that..."

${context.slot.coldClimate ? `This is a cold-climate pattern. Use Edmonton-specific evidence where possible. Reference Canadian programs, northern European examples, or cold-climate research. Be specific about temperatures, frost lines, snow loads, heating degree days, and seasonal daylight variation.` : ''}

Connect to Alexander where relevant. Show how this pattern extends, updates, or fills a gap in his original 253.

### 4. Therefore (one bold paragraph)
State the design solution as a SPATIAL MOVE AN ARCHITECT COULD DRAW.

Include at least one TESTABLE CRITERION — something you can measure, count, observe, or model. The best tests are physical and simple.

WRONG: "Therefore: ensure communities have access to adequate green space." (policy)
RIGHT: "Therefore: on every lot, direct roof and driveway runoff to a planted depression — a rain garden — before it reaches the storm drain. Size the garden to absorb a two-year storm event." (spatial, specific, testable)

### 5. Closing Connections (one line)
"…this pattern connects to [PATTERN X] (id), [PATTERN Y] (id), and [PATTERN Z] (id)…"
Name 2-4 smaller-scale patterns that help implement this one.

## Voice

Write like Alexander: warm, specific, authoritative, grounded in human experience. Use concrete sensory language — what you can see, touch, hear, feel. Speak directly to the reader. Be occasionally beautiful.

NOT academic: "This pattern addresses the intersection of thermal performance and occupant wellbeing."
NOT policy: "Municipalities should consider implementing incentive programs."
NOT marketing: "Transform your living experience with nature-inspired design."

YES: "The room you survive in when the power goes out during a heat wave."
YES: "Reachable in pajamas, in February, in the dark."
YES: "A garden that is beautiful, ecologically alive, and fire-resistant — not a moonscape with a house in the middle."

## Constraints

- 500-800 words total (problem + evidence + therefore). Tight, not bloated.
- Every factual claim must be specific and verifiable. No hand-waving.
- Connections must reference real pattern IDs from the catalog.
- The "therefore" must pass the napkin test: could an architect sketch it?
- Include a testable criterion — a hard physical test if possible.
- Confidence rating: assign ★★, ★, or ☆ honestly based on the evidence you're using.
  ★★ = evidence from 3+ independent contexts with measurements
  ★ = evidence from 1-2 contexts with reasonable theory
  ☆ = theoretical, extrapolated, speculative but well-reasoned

## Output Format

Return the complete pattern as markdown with YAML frontmatter:

\`\`\`markdown
---
id: ${context.slot.id}
name: "${context.slot.name}"
scale: "${context.slot.scale}"
category: "${context.slot.category}"
categoryLabel: "${context.slot.categoryLabel}"
confidence: [0, 1, or 2]
status: "candidate"
connections_up: [list of IDs]
connections_down: [list of IDs]
coldClimate: ${context.slot.coldClimate}
tags: [relevant tags]
---

# ${String(context.slot.id).padStart(2, '0')}. ${context.slot.name} [★★/★/☆]

**…beyond [PATTERN A] (id), [PATTERN B] (id)…**

**[Problem statement — the tension, in bold]**

[Evidence paragraph 1]

[Evidence paragraph 2]

[Evidence paragraph 3 if needed]

**Therefore: [Solution — the spatial move, in bold. Include testable criterion.]**

**…this pattern connects to [PATTERN X] (id), [PATTERN Y] (id)…**
\`\`\`

Return ONLY the markdown. No preamble, no commentary outside the pattern.`;
}
```

---

## Research Prompt

When `--research` flag is used, the generator first searches for real evidence:

```typescript
export function buildResearchPrompt(slot: PatternSlot): string {
  return `You are researching evidence for a design pattern about: "${slot.name}"

Brief: ${slot.brief}
Tension: ${slot.tension}
Scale: ${slot.scale}
Cold-climate relevant: ${slot.coldClimate}

Search for REAL, VERIFIABLE evidence. I need:

1. PROGRAMS: Real policies, initiatives, or programs related to this topic.
   For each: city/country, year implemented, specific outcomes with numbers.

2. STATISTICS: Specific numbers from credible sources.
   For each: the exact figure, the source organization, the year.

3. STUDIES: Academic papers or official reports.
   For each: author(s), title, year, journal/publisher, key finding.

4. BUILT EXAMPLES: Places where this design principle has been implemented.
   For each: location, what was built, measurable outcomes if available.

${slot.coldClimate ? `Prioritize cold-climate evidence: Canadian cities, Scandinavian countries, northern Japan, Russia, northern China. Edmonton-specific data is especially valuable.` : ''}

Rules:
- Only include evidence you can confirm through search. Do not invent citations.
- Primary sources over secondary. Government reports over news articles.
- Include the URL or specific source name for every item.
- If you can't find strong evidence for this topic, say so honestly. A pattern with thin evidence should have a ☆ confidence rating, not fabricated citations.
- Aim for at least 3 items per category, but quality over quantity.

Return a JSON object:
{
  "programs": [{ "name": "", "location": "", "year": "", "outcome": "", "source": "" }],
  "statistics": [{ "claim": "", "source": "", "year": "" }],
  "studies": [{ "authors": "", "title": "", "year": "", "finding": "" }],
  "examples": [{ "location": "", "description": "", "source": "" }],
  "evidenceStrength": "strong" | "moderate" | "thin",
  "suggestedConfidence": 0 | 1 | 2,
  "notes": "Any caveats about evidence quality"
}`;
}
```

The research results are injected into the drafting prompt as a `## Verified Evidence` section, so the drafter builds from real sources rather than generating from training data.

---

## Revise Mode

When a pattern fails Red Team or Research Verification, the generator can revise it:

```bash
npx tsx tools/pattern-generator/generate.ts --revise drafts/034-winter-walking-network.md --feedback "RT: Spatial specificity needs work. RV: Portland claim is PARTIALLY verified — uses 20-minute not 15-minute."
```

The reviser loads the original draft, the feedback, and the same context used for the initial draft, then produces a revised version. The revision prompt is specific:

```typescript
export function buildRevisionPrompt(
  originalDraft: string,
  feedback: string,
  context: GenerationContext
): string {
  return `You are revising a Language A pattern that did not pass quality review.

## Original Draft

${originalDraft}

## Quality Gate Feedback

${feedback}

## Revision Instructions

Fix ONLY what the feedback identifies. Do not rewrite sections that weren't flagged. Preserve the voice, structure, and content that works.

Specific rules:
- If spatial specificity was flagged: add physical dimensions, materials, relationships to other building elements. The "therefore" must pass the napkin test.
- If evidence quality was flagged: replace vague claims with specific, cited evidence. If a claim was marked FABRICATED or DISPUTED, remove it entirely and replace with verified evidence. If marked PARTIALLY, adjust the language to match what's actually verifiable.
- If problem statement was flagged: rewrite as a genuine tension between competing forces. Both sides must be named.
- If voice was flagged: remove academic, policy, or marketing language. Add sensory detail. Make it warmer and more specific.
- If testability was flagged: add a hard, physical test criterion to the "therefore."
- If confidence was flagged: adjust the rating to match the evidence. Downgrade if necessary.
- If network integration was flagged: fix connection references to real pattern IDs. Ensure connections are structural dependencies.

Return the complete revised pattern in the same markdown format. Do not explain your changes — just return the revised pattern.`;
}
```

---

## The Draft-Review Loop

The most common workflow is:

```bash
# 1. Generate with research
npx tsx tools/pattern-generator/generate.ts --id 34 --research

# 2. Run quality gate
npx tsx tools/quality-gate.ts --draft drafts/034-winter-walking-network.md

# 3. If it fails, revise with feedback
npx tsx tools/pattern-generator/generate.ts --revise drafts/034-winter-walking-network.md \
  --feedback "RT: Problem statement is advocacy not tension. RV: Helsinki walkway stat is UNVERIFIED."

# 4. Run quality gate again
npx tsx tools/quality-gate.ts --draft drafts/034-winter-walking-network.md

# 5. If it passes, Andrew reviews and approves
# 6. Move to patterns/ directory with status: "published"
```

For batch generation, the tool can automate the loop:

```bash
# Generate, review, and auto-revise up to 3 times per pattern
npx tsx tools/pattern-generator/generate.ts --batch --priority high --auto-revise 3
```

The `--auto-revise` flag:
1. Generates the draft
2. Runs Red Team review
3. If REVISE, feeds the feedback back to the reviser and regenerates
4. Repeats up to N times
5. After N attempts, saves whatever it has and marks it for human review
6. Does NOT run Research Verification in the auto-loop (too slow and expensive) — that runs separately after Red Team passes

---

## TypeScript Interfaces

```typescript
// types.ts

export interface PatternSlot {
  id: number;
  name: string;
  scale: "neighborhood" | "building" | "construction";
  category: string;
  categoryLabel: string;
  status: "existing" | "planned";
  brief: string;
  tension: string;
  connections: number[];
  coldClimate: boolean;
  alexanderRef?: number[];
  priority: "high" | "medium" | "low";
}

export interface GenerationContext {
  slot: PatternSlot;
  connectedPatterns: PatternInput[];
  categoryPatterns: PatternInput[];
  scaleNeighbors: PatternInput[];
  verticalChain: {
    above: PatternSlot[];
    below: PatternSlot[];
  };
  andrewContext?: string;
  existingDraft?: string;
  redTeamFeedback?: string;
  research?: ResearchResult;
}

export interface ResearchResult {
  programs: {
    name: string;
    location: string;
    year: string;
    outcome: string;
    source: string;
  }[];
  statistics: {
    claim: string;
    source: string;
    year: string;
  }[];
  studies: {
    authors: string;
    title: string;
    year: string;
    finding: string;
  }[];
  examples: {
    location: string;
    description: string;
    source: string;
  }[];
  evidenceStrength: "strong" | "moderate" | "thin";
  suggestedConfidence: 0 | 1 | 2;
  notes: string;
}

export interface GenerationResult {
  patternId: number;
  patternName: string;
  draftPath: string;
  confidence: number;
  researchUsed: boolean;
  autoReviseAttempts: number;
  finalRedTeamVerdict?: string;
  finalRedTeamScore?: number;
  timestamp: string;
  model: string;
}

export interface BatchGenerationSummary {
  total: number;
  generated: number;
  passedRedTeam: number;
  needsHumanReview: number;
  failed: number;
  averageRedTeamScore: number;
  averageReviseAttempts: number;
  byPriority: {
    high: { total: number; generated: number; passed: number };
    medium: { total: number; generated: number; passed: number };
    low: { total: number; generated: number; passed: number };
  };
}
```

---

## API Configuration

```typescript
// Drafting uses Sonnet for speed — generating 221 patterns with Opus would be slow and expensive
const DRAFT_MODEL = "claude-sonnet-4-5-20250929";

// Research uses Sonnet with web search
const RESEARCH_MODEL = "claude-sonnet-4-5-20250929";

// Revision uses Sonnet — same model that drafted, so it understands the voice
const REVISE_MODEL = "claude-sonnet-4-5-20250929";

// Temperature: 0.6 for drafting (needs creativity), 0.1 for research (needs precision)
const DRAFT_TEMPERATURE = 0.6;
const RESEARCH_TEMPERATURE = 0.1;
const REVISE_TEMPERATURE = 0.4;

// Max tokens: 4096 for drafting (patterns are 500-800 words + frontmatter)
const DRAFT_MAX_TOKENS = 4096;
```

---

## Rate Limiting and Cost

**Per pattern (with research):**
- 1 research call (with web search): ~$0.05
- 1 drafting call: ~$0.03
- 1-3 Red Team review calls: ~$0.03 each
- Total per pattern: ~$0.15-0.25

**For 221 new patterns:**
- With research: ~$55
- Without research: ~$25
- With auto-revise (avg 1.5 attempts): ~$75

**Timing:**
- Research: ~30 seconds per pattern
- Drafting: ~15 seconds per pattern
- Red Team review: ~20 seconds per pattern
- Full pipeline per pattern: ~90 seconds
- 221 patterns: ~5.5 hours for full pipeline

**Optimization:** Run in phases:
1. Generate all HIGH priority patterns with --research (45 patterns, ~1.5 hours)
2. Run batch quality gate
3. Auto-revise failures
4. Andrew reviews the HIGH batch
5. Repeat for MEDIUM, then LOW

---

## Output Format

Each draft is saved as a standalone markdown file:

```
drafts/
├── 034-winter-walking-network.md
├── 034-winter-walking-network.research.json    # Research results (if --research used)
├── 034-winter-walking-network.review.json      # Red Team review (if --gate used)
├── 035-the-corner-store.md
└── ...
```

The `.research.json` and `.review.json` sidecar files preserve the evidence trail. Andrew can see exactly what evidence was found, what the Red Team said, and how many revision attempts were made.

---

## Implementation Order

1. **types.ts** — interfaces
2. **context.ts** — gather context from catalog plan and existing patterns
3. **prompt.ts** — drafting, research, and revision system prompts
4. **drafter.ts** — core drafting logic (single pattern)
5. **reviser.ts** — revision logic (takes feedback, produces new draft)
6. **formatter.ts** — terminal output
7. **generate.ts** — main CLI entry point
8. **batch.ts** — batch generation with auto-revise loop

---

## Validation Test

After building, test with a pattern from the catalog plan:

```bash
# Pick a HIGH priority pattern from the plan
# (exact ID depends on what the Category Planner generated)

# Draft with research
npx tsx tools/pattern-generator/generate.ts --id 34 --research

# Review the draft
cat drafts/034-*.md

# Run quality gate
npx tsx tools/quality-gate.ts --draft drafts/034-*.md
```

**Expected outcome:**
- Draft is 500-800 words in correct Alexandrian format
- YAML frontmatter matches the pattern schema
- Connections reference real pattern IDs
- Evidence is specific and cited (if --research was used)
- Red Team scores 6+ on most dimensions
- May need 1-2 revisions to reach PUBLISH quality

---

## What This Does NOT Do

- Does not decide which patterns to write. The Category Planner does that.
- Does not evaluate quality. Red Team and Research Verification do that.
- Does not publish. Andrew does that.
- Does not guarantee first-draft quality. The auto-revise loop and human review exist because first drafts are rarely perfect.
- Does not replace human creativity. Andrew can override any draft, add personal context, or write patterns from scratch. The generator handles volume; Andrew handles vision.
