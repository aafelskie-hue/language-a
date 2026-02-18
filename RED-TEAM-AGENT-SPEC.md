# Red Team Agent — Implementation Spec

## INSTRUCTIONS FOR CLAUDE CODE

Build a CLI tool that reviews Language A patterns against a strict editorial rubric before they can be committed as `status: "published"`. This is the quality gate. Nothing ships without passing it.

The tool runs locally in the Language A repo. It reads a pattern (markdown or JSON), sends it to the Anthropic API with a hardened system prompt, and returns a structured editorial review. The review scores seven dimensions, flags specific line-level issues, and returns a verdict: **PUBLISH**, **REVISE**, or **RETHINK**.

The agent should be opinionated and harsh. It is easier to override a strict gate than to catch quality problems after 200 patterns have shipped. Alexander gave many of his own patterns one star. This agent should be comfortable doing the same.

---

## Architecture

```
language-a/
├── tools/
│   ├── red-team/
│   │   ├── review.ts            # Main CLI entry point
│   │   ├── rubric.ts            # The seven-dimension rubric (exported for reuse)
│   │   ├── prompt.ts            # System prompt construction
│   │   ├── parser.ts            # Parse pattern from .md or .json input
│   │   ├── formatter.ts         # Format review output for terminal
│   │   ├── batch.ts             # Batch review all patterns in a directory
│   │   └── types.ts             # TypeScript interfaces
│   └── tsconfig.json            # Separate tsconfig for tools (Node target)
├── patterns/                    # Pattern source files (markdown)
│   ├── 001-fifteen-minute-neighborhood.md
│   ├── 002-third-place-network.md
│   └── ...
└── data/
    └── patterns.json            # Compiled pattern data for the app
```

### Dependencies

```json
{
  "@anthropic-ai/sdk": "^0.74.0",
  "chalk": "^5.3.0",
  "commander": "^12.0.0",
  "gray-matter": "^4.0.3"
}
```

Use the project's existing `@anthropic-ai/sdk`. Add `chalk` for terminal color output, `commander` for CLI argument parsing, and `gray-matter` for parsing markdown frontmatter.

### CLI Interface

```bash
# Review a single pattern
npx tsx tools/red-team/review.ts patterns/001-fifteen-minute-neighborhood.md

# Review a single pattern from JSON
npx tsx tools/red-team/review.ts --json data/patterns.json --id 1

# Batch review all patterns in a directory
npx tsx tools/red-team/review.ts --batch patterns/

# Batch review with summary only (no full reports)
npx tsx tools/red-team/review.ts --batch patterns/ --summary

# Review with strict mode (fails on any "Needs Work")
npx tsx tools/red-team/review.ts patterns/001.md --strict

# Output as JSON (for CI integration or piping)
npx tsx tools/red-team/review.ts patterns/001.md --output json

# Compare a pattern against a specific existing pattern (for overlap detection)
npx tsx tools/red-team/review.ts patterns/008.md --compare patterns/009.md
```

The tool reads `ANTHROPIC_API_KEY` from the environment or from a `.env` file in the repo root.

---

## The Rubric — Seven Dimensions

Each dimension is scored: **Pass** (8–10), **Needs Work** (4–7), or **Fail** (0–3).

### 1. Problem Statement

**What "Pass" looks like:**
A genuine design *tension* — two or more forces in conflict. Alexander's problems always named competing needs. The format is: "When [condition], [force A] suffers because [force B] demands the opposite." The reader should feel the pull of both sides.

**What "Fail" looks like:**
Advocacy for a position disguised as a problem statement. "When cities don't invest in bike lanes, cyclists are unsafe" — that's a policy argument, not a design tension. The test: if you can't imagine a reasonable person disagreeing with the problem framing, it's advocacy, not tension.

**Red flags to catch:**
- Problem states a conclusion rather than a tension
- Only one force is named (no conflict)
- Problem is about policy, not spatial design
- Problem could be solved by a law rather than a building

### 2. Spatial Specificity

**What "Pass" looks like:**
The "therefore" describes a design move an architect could draw. It answers: what gets built, where, at what scale, in what relationship to other things? Heat Refuge Room: "north-facing or heavily shaded; thick walls or high thermal mass; operable windows positioned for cross-ventilation." You can draw that.

**What "Fail" looks like:**
The solution is a policy recommendation, a behavior change, a materials specification without spatial consequence, or a vague aspiration. "Ensure every neighborhood has access to transit" — that's planning, not design. "Use low-VOC materials" — that's a spec, not a spatial move. The test: could you sketch the "therefore" on the back of a napkin?

**Red flags to catch:**
- Solution describes a program, not a place
- Solution is a checklist of features without spatial relationships
- Solution tells you what to buy, not what to build
- Solution works at the policy scale but not the building scale
- "Therefore: ensure..." or "Therefore: require..." (governance language, not design language)

### 3. Evidence Quality

**What "Pass" looks like:**
Specific, cited, verifiable. Names the city, the year, the program, the measurement, the study. "Philadelphia's Green City, Clean Waters program has installed over 2,800 greened acres" — that's checkable. "Minneapolis eliminated single-family-only zoning in 2018" — that's a fact with a date.

**What "Fail" looks like:**
"Research shows..." "Studies suggest..." "Experts agree..." — all weasel phrases that cite nothing. Also: cherry-picked statistics without context, outdated data presented as current, or evidence from one climate/culture presented as universal without qualification.

**Red flags to catch:**
- "Research shows" / "studies suggest" without naming the research
- Statistics without source, year, or context
- Evidence from a single city claimed as universal
- Outdated data (pre-2015) presented without noting the date
- Circular evidence (the pattern's existence is cited as proof the pattern works)

### 4. Network Integration

**What "Pass" looks like:**
Connections are real dependencies, not just thematic associations. "This pattern gives form to THE HOME OFFICE THRESHOLD (258)" means you literally cannot build 259 without first solving 258. The connection has *structural* meaning — removing the connected pattern would change how this one works.

**What "Fail" looks like:**
Name-dropping patterns that share a theme but don't actually depend on each other. Connecting to patterns that don't exist in the 254. Connecting only to Alexander's original patterns without linking into the Language A network.

**Red flags to catch:**
- Connections are thematic rather than structural ("both are about sustainability")
- Pattern references numbers that don't exist in the current catalog
- Pattern connects only upward or only downward (should have both)
- Pattern connects only to Alexander's originals, not to other Language A patterns
- More than 8 connections total (probably name-dropping rather than real dependencies)
- Fewer than 3 connections total (pattern is floating, not integrated)

### 5. Alexandrian Voice

**What "Pass" looks like:**
Warm, specific, authoritative, grounded in human experience. Speaks directly to the reader. Uses concrete sensory language — "the room you survive in when the power goes out," "reachable in pajamas, in February, in the dark." Treats the reader as an intelligent adult making real decisions about real buildings. Occasionally beautiful.

**What "Fail" looks like:**
Academic prose ("This pattern addresses the intersection of..."). Policy language ("Municipalities should consider..."). Marketing copy ("Transform your living experience with..."). Blog post tone ("Here's why this matters..."). Technical manual tone ("Install R-40 insulation in the north wall assembly per ASHRAE 90.1...").

**Red flags to catch:**
- Passive voice dominance ("it is recommended that...")
- Jargon without translation (technical terms not grounded in experience)
- No sensory language — nothing you can see, touch, hear, or feel
- Hedging ("might," "could," "may want to consider") — Alexander was direct
- List-heavy prose that reads like a specification rather than a narrative
- No human beings in the text — all buildings, no inhabitants

### 6. Testability

**What "Pass" looks like:**
The pattern includes a criterion you can verify. "Light on two sides of every room" — walk into the room, count the windows on exterior walls, pass or fail. "The 72-hour power failure test" — model or measure the room's temperature without mechanical cooling for three days. The best patterns have hard, physical tests.

**What "Fail" looks like:**
The criterion is subjective ("feels welcoming"), unmeasurable ("improves community"), or absent entirely. A pattern without a testable criterion is an opinion, not a hypothesis.

**Red flags to catch:**
- No explicit test or criterion in the "therefore"
- Test is purely subjective ("should feel...")
- Test requires instrumentation the builder won't have
- Test is binary but trivial (present/absent rather than quality threshold)
- Pattern states a goal without a way to verify it's been achieved

### 7. Confidence Rating Honesty

**What "Pass" looks like:**
The self-assigned confidence rating matches the evidence. ★★ means: tested in multiple contexts, strong empirical support, specific and replicable. ★ means: strong theoretical basis, some empirical support, may vary by context. ☆ means: promising idea, limited evidence, needs testing.

**What "Fail" looks like:**
A ★★ pattern with evidence from only one city. A ★★ pattern with no testable criterion. A ★★ pattern that's never been built. Alexander gave many of his best-loved patterns only one star because he was honest about what he hadn't yet proven.

**Suggested confidence recalibration:**
- ★★: Evidence from 3+ independent contexts, specific measurements, testable criterion, has been built and evaluated
- ★: Evidence from 1–2 contexts, reasonable theoretical basis, testable but not yet widely tested
- ☆: Theoretical, extrapolated from adjacent domains, speculative but well-reasoned

---

## System Prompt

The system prompt is the core of the agent. It must be precise, opinionated, and grounded in examples.

```typescript
// prompt.ts

export function buildSystemPrompt(patternCatalog: PatternIndex[]): string {
  return `You are the Red Team editorial reviewer for Language A, a collection of 254 design patterns for neighborhoods, buildings, and construction. Your job is to review patterns against a strict quality rubric before they are published.

You are harsh, specific, and honest. You would rather reject a good pattern that needs polish than publish a weak pattern that dilutes the collection. Christopher Alexander gave many of his own patterns only one star. You should be at least that honest.

## Your Standards

You evaluate every pattern on seven dimensions. For each dimension, you assign a score:
- **Pass** (8–10): Meets the standard. Minor polish only.
- **Needs Work** (4–7): The right instinct but needs specific revision. You MUST state exactly what to fix.
- **Fail** (0–3): Fundamental problem. Pattern needs rethinking, not editing.

### Dimension 1: Problem Statement
A genuine design tension — two or more forces in conflict. NOT advocacy, NOT a conclusion, NOT a policy position. Test: can you imagine a reasonable person feeling pulled by both sides of the tension?

GOOD: "When people work from home without a physical transition between workspace and living space, neither work nor rest is fully possible."
BAD: "When cities fail to invest in cycling infrastructure, cyclists are unsafe."

### Dimension 2: Spatial Specificity
The "therefore" must describe a design move an architect could draw on a napkin. NOT a policy, NOT a behavior, NOT a materials spec without spatial consequence.

GOOD: "Create a physical threshold between the workspace and the living space — a change in floor level or material, a passage through a buffer space, a shift in light quality."
BAD: "Ensure neighborhoods have adequate access to public transportation options."

### Dimension 3: Evidence Quality
Specific, cited, verifiable. Names the city, year, program, measurement, or study. NO "research shows," NO "studies suggest," NO "experts agree."

GOOD: "Minneapolis eliminated single-family-only zoning in 2018, allowing triplexes on any residential lot."
BAD: "Research demonstrates that mixed-use zoning improves neighborhood outcomes."

### Dimension 4: Network Integration
Connections must be structural dependencies, not thematic associations. Removing the connected pattern should change how this one works. The pattern must connect to other Language A patterns, not only to Alexander's originals. Must have both upward and downward connections. Between 3 and 8 total connections.

Current Language A pattern catalog for reference:
${patternCatalog.map(p => `${p.id}. ${p.name} [${p.scale}]`).join('\n')}

### Dimension 5: Alexandrian Voice
Warm, specific, authoritative, grounded in sensory human experience. Uses concrete language you can see, touch, hear, feel. Speaks directly to the reader. NO academic prose, NO policy language, NO marketing copy, NO technical manual.

GOOD: "Reachable in pajamas, in February, in the dark."
BAD: "This pattern addresses the intersection of thermal performance and occupant wellbeing."

### Dimension 6: Testability
The pattern must include a verifiable criterion. Something you can measure, count, observe, or model. The best tests are physical and simple.

GOOD: "Test this room against a 72-hour power failure during a peak heat event. If it's not survivable, redesign."
BAD: "The space should feel welcoming and promote community interaction."

### Dimension 7: Confidence Rating Honesty
★★ requires evidence from 3+ independent contexts with specific measurements.
★ requires evidence from 1–2 contexts with reasonable theoretical basis.
☆ is theoretical or extrapolated.
Most patterns should be ★. Giving ★★ is a high bar. Recommend a rating based on the evidence actually presented, not the evidence that could theoretically exist.

## Review Format

For each pattern, return your review in this exact structure:

PATTERN: [number]. [name]
CURRENT RATING: [★★ / ★ / ☆]

--- DIMENSION SCORES ---

1. PROBLEM STATEMENT: [Pass/Needs Work/Fail] ([score]/10)
[2-3 sentences explaining the score. Quote the specific text that works or doesn't.]

2. SPATIAL SPECIFICITY: [Pass/Needs Work/Fail] ([score]/10)
[2-3 sentences. If Needs Work or Fail, state exactly what spatial move is missing.]

3. EVIDENCE QUALITY: [Pass/Needs Work/Fail] ([score]/10)
[2-3 sentences. Name specific claims that need citations or specific citations that check out.]

4. NETWORK INTEGRATION: [Pass/Needs Work/Fail] ([score]/10)
[2-3 sentences. Flag any dead references, missing directions, or thematic-only connections.]

5. ALEXANDRIAN VOICE: [Pass/Needs Work/Fail] ([score]/10)
[2-3 sentences. Quote the best and worst lines.]

6. TESTABILITY: [Pass/Needs Work/Fail] ([score]/10)
[2-3 sentences. If no test exists, propose one.]

7. CONFIDENCE RATING: [Pass/Needs Work/Fail] ([score]/10)
SUGGESTED RATING: [★★ / ★ / ☆]
[2-3 sentences justifying the suggested rating vs. the current one.]

--- VERDICT ---

[PUBLISH / REVISE / RETHINK]

[If REVISE: numbered list of specific fixes, in priority order. Max 5.]
[If RETHINK: 1-2 sentences on what's fundamentally wrong and what the pattern should become instead.]
[If PUBLISH: 1 sentence confirming it's ready, plus any optional polish suggestions.]

--- OVERLAP CHECK ---

[Flag any patterns in the current catalog that cover substantially the same ground. Name them and explain the overlap. If no overlap, state "No significant overlap detected."]

## Rules

- Never praise a pattern to soften a critique. Be direct.
- Never suggest adding content that would make the pattern longer than ~800 words. Patterns should be tight.
- If a pattern is good, say so briefly and move on. Don't pad the review.
- If you suggest a confidence downgrade, that is not a criticism — it is honesty. Alexander's best patterns often had one star.
- Quote specific text from the pattern in your review. Don't speak in abstractions about abstractions.
- If the pattern reads like a policy brief, say "this reads like a policy brief." If it reads like a blog post, say so. Name the genre it accidentally inhabits.
- Your job is to make every published pattern worthy of sitting next to Alexander's originals. That is a high bar. Hold it.`;
}
```

---

## TypeScript Interfaces

```typescript
// types.ts

export interface PatternInput {
  id: number;
  name: string;
  scale: "neighborhood" | "building" | "construction";
  confidence: 0 | 1 | 2;
  status: "published" | "candidate" | "proposed";
  problem: string;
  body: string;
  solution: string;
  connections_up: number[];
  connections_down: number[];
  category?: string;
  categoryLabel?: string;
  tags?: string[];
}

export interface PatternIndex {
  id: number;
  name: string;
  scale: string;
}

export type DimensionScore = "Pass" | "Needs Work" | "Fail";

export type Verdict = "PUBLISH" | "REVISE" | "RETHINK";

export interface DimensionReview {
  dimension: string;
  score: DimensionScore;
  numericScore: number;
  feedback: string;
}

export interface ReviewResult {
  patternId: number;
  patternName: string;
  currentRating: number;          // 0, 1, 2
  suggestedRating: number;        // 0, 1, 2
  dimensions: DimensionReview[];
  verdict: Verdict;
  verdictDetail: string;          // The fix list or rethink explanation
  overlapCheck: string;
  rawResponse: string;            // Full API response for debugging
  timestamp: string;
  model: string;
}

export interface BatchSummary {
  total: number;
  publish: number;
  revise: number;
  rethink: number;
  ratingChanges: {
    patternId: number;
    patternName: string;
    current: number;
    suggested: number;
  }[];
  overlapWarnings: {
    patternId: number;
    overlapsWithIds: number[];
    explanation: string;
  }[];
}
```

---

## Pattern Markdown Format

Patterns are stored as markdown files with YAML frontmatter. This is the source format that the Red Team agent reads and that gets compiled into `patterns.json` for the app.

```markdown
---
id: 1
name: "The Fifteen-Minute Neighborhood"
scale: "neighborhood"
category: "fifteen-minute-life"
categoryLabel: "Patterns for the Fifteen-Minute Life"
confidence: 2
status: "candidate"
connections_up: []
connections_down: [2, 3, 4]
tags: ["urbanism", "walkability", "transit"]
---

# 01. The Fifteen-Minute Neighborhood ★★

**…beyond SUBCULTURE BOUNDARY (13), COMMUNITY OF 7000 (12), and WEB OF PUBLIC TRANSPORTATION (16)…**

**When daily needs — groceries, school, a park, a café, a doctor — require a car to reach, people spend hours each week in transit, neighborhoods lose their social fabric, and the elderly and young become dependent on those who can drive.**

The concept has been validated globally. Paris, Melbourne, and Portland have restructured planning around the principle...

[body text continues]

**Therefore: arrange every neighborhood so that a resident can reach groceries, a school, a park, a primary care clinic, a gathering place, and public transit within fifteen minutes on foot or by bicycle.**

**…this pattern gains life from ACTIVITY NODES (30), PROMENADE (31), LOCAL SHOPS (89), HEALTH CENTER (47), and shapes the ground for NETWORK OF PATHS AND CARS (52)…**
```

---

## Parser Requirements

The parser (`parser.ts`) must handle two input formats:

### Markdown Input
1. Parse YAML frontmatter with `gray-matter`
2. Extract problem statement: the first bold paragraph after the upward connections
3. Extract body: everything between problem and solution
4. Extract solution: the bold paragraph starting with "Therefore:"
5. Extract upward connections from the "…beyond…" line
6. Extract downward connections from the closing "…this pattern…" line
7. Validate: error if any required field is missing

### JSON Input
1. Read from `patterns.json`
2. Filter by `--id` flag
3. Validate against `PatternInput` interface

---

## Formatter Requirements

The terminal output (`formatter.ts`) uses `chalk` for color:

```
═══════════════════════════════════════════════════════════
RED TEAM REVIEW — 01. The Fifteen-Minute Neighborhood
═══════════════════════════════════════════════════════════

PROBLEM STATEMENT          ██████████░  Pass (9/10)
  Clear tension between accessibility needs and car
  dependency. Both sides of the force are named.

SPATIAL SPECIFICITY        ████████░░░  Needs Work (7/10)
  "Arrange every neighborhood so that a resident can
  reach groceries..." — this is land-use planning, not
  a spatial design move. What does the neighborhood
  LOOK LIKE? What's the physical form?

EVIDENCE QUALITY           ██████████░  Pass (9/10)
  Paris, Melbourne, Portland — three independent
  contexts named. Moreno's Sorbonne research cited.
  COVID-19 observation is specific.

NETWORK INTEGRATION        █████████░░  Pass (8/10)
  Connects to 4 Alexander patterns and 3 Language A
  patterns. All connections are real dependencies.

ALEXANDRIAN VOICE          ██████████░  Pass (9/10)
  Best line: "people confined to their neighborhoods
  discovered whether those neighborhoods could actually
  sustain daily life, or whether they were merely
  dormitories."

TESTABILITY                █████████░░  Pass (8/10)
  "Functional completeness within walking distance" is
  testable — you can walk it and check. Could be more
  specific about what "functional completeness" means.

CONFIDENCE RATING          █████████░░  Pass (8/10)
  ★★ justified — three cities, named research,
  testable criterion.
  SUGGESTED RATING: ★★

═══════════════════════════════════════════════════════════
VERDICT: REVISE
  1. Sharpen the "therefore" with spatial form — what
     does a 15-minute neighborhood physically look like
     at the block and street level?
  2. Define "functional completeness" as a specific
     checklist (the pattern almost does this already)
═══════════════════════════════════════════════════════════

OVERLAP: No significant overlap detected.
```

**Color coding:**
- Pass: green
- Needs Work: yellow/amber
- Fail: red
- Verdict PUBLISH: green bold
- Verdict REVISE: yellow bold
- Verdict RETHINK: red bold
- Pattern name: white bold
- Dimension names: cyan
- Quoted text from pattern: dim/italic

**Progress bars:** Use filled/empty block characters (█░) scaled to score out of 10.

---

## Batch Mode

`--batch` runs the review on every `.md` file in the specified directory and outputs:

1. Individual reviews (unless `--summary` flag suppresses them)
2. A summary table:

```
═══════════════════════════════════════════════════════════
BATCH SUMMARY — 33 patterns reviewed
═══════════════════════════════════════════════════════════

PUBLISH:  18  ██████████████████░░░░░░░░░░░░░░░░░  55%
REVISE:   12  ████████████░░░░░░░░░░░░░░░░░░░░░░░  36%
RETHINK:   3  ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   9%

RATING CHANGES SUGGESTED:
  #08  The Screen-Free Hearth     ★★ → ★
  #12  Signal Architecture        ★  → ☆
  #27  Suburban Densification     ★  → ☆

OVERLAP WARNINGS:
  #08 (Screen-Free Hearth) ↔ #09 (The Quiet Zone)
    Both address technology/attention in domestic space.
    Distinction needs sharpening.

WEAKEST DIMENSIONS (most Needs Work + Fail):
  1. Spatial Specificity    — 14 patterns flagged
  2. Testability            — 11 patterns flagged
  3. Confidence Rating      —  8 patterns flagged
═══════════════════════════════════════════════════════════
```

3. A JSON report saved to `tools/red-team/reports/review-YYYY-MM-DD-HHMMSS.json` with full structured data for every pattern reviewed.

---

## Compare Mode

`--compare` takes two pattern files and specifically checks for scope overlap:

```bash
npx tsx tools/red-team/review.ts patterns/008.md --compare patterns/009.md
```

The system prompt gets an additional instruction: "You are comparing two patterns to determine if they cover substantially the same ground and should be merged, or if they address genuinely distinct design problems. Be specific about where they overlap and where they diverge."

Output: a focused overlap analysis with a recommendation (Keep Separate / Merge / Rethink Split).

---

## Strict Mode

`--strict` changes the verdict threshold:
- Normal mode: PUBLISH if no Fails and no more than 2 Needs Work
- Strict mode: PUBLISH only if all dimensions Pass

Use strict mode before committing patterns as `status: "published"`. Use normal mode during drafting and iteration.

---

## API Configuration

```typescript
// review.ts

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 4096,
  temperature: 0.3,           // Low temperature for consistent, precise reviews
  system: buildSystemPrompt(patternCatalog),
  messages: [
    {
      role: "user",
      content: formatPatternForReview(pattern)
    }
  ]
});
```

**Model choice:** Use `claude-sonnet-4-5-20250929` for reviews. Fast enough for batch mode, smart enough for nuanced editorial judgment. Do not use Haiku — the rubric requires genuine critical thinking, not pattern matching.

**Temperature 0.3:** Low enough for consistency across runs, high enough to avoid robotic repetition.

**Rate limiting for batch mode:** Add a 1-second delay between API calls to stay under rate limits. For 254 patterns, batch review takes ~5 minutes.

---

## Implementation Order

1. **types.ts** — interfaces and types
2. **parser.ts** — read .md and .json pattern files
3. **prompt.ts** — system prompt construction
4. **formatter.ts** — terminal output formatting
5. **review.ts** — main CLI with single-pattern review
6. **batch.ts** — batch review mode
7. **Test against the existing 33 patterns** — run batch mode and verify the output matches the editorial notes doc (PATTERN-EDITORIAL-NOTES.md). The Red Team agent should independently arrive at similar conclusions to the human editorial review. If it doesn't, adjust the rubric.

---

## Validation Test

After building, run the agent against three known patterns and verify:

1. **Pattern 269 (Heat Refuge Room)** — editorial notes say "Standout. None substantive." The agent should return PUBLISH or REVISE with minor notes only.

2. **Pattern 278 (The Edible Landscape)** — editorial notes say "RETHINK. Reads as permaculture advocacy rather than a pattern." The agent should catch this and return RETHINK.

3. **Pattern 261 (The Screen-Free Hearth)** — editorial notes say "SHARPEN DISTINCTION" with 262. The agent should flag the overlap and flag the spatial specificity gap.

If the agent agrees with the human editorial review on at least 2 of these 3, the rubric is calibrated. If it disagrees on 2 or more, the system prompt needs adjustment before batch processing.

---

## What This Does NOT Do

- It does not auto-fix patterns. It reviews and recommends. The human approves.
- It does not generate new patterns. That's a separate tool (the Pattern Generator, Module 3).
- It does not modify the app or deploy anything. It's a local quality gate only.
- It does not replace human judgment. It amplifies it. Andrew has final approval on every verdict.
