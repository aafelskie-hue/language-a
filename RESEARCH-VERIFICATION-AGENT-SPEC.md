# Research Verification Agent — Implementation Spec

## INSTRUCTIONS FOR CLAUDE CODE

Build a CLI tool that fact-checks every verifiable claim in a Language A pattern before publication. This is the second quality gate — it runs after the Red Team editorial review and before Andrew's final approval.

The Red Team checks form. This tool checks facts.

When AI generates 221 new patterns, the single biggest quality risk is plausible-sounding evidence that doesn't exist: citations to papers that were never published, statistics that are directionally right but numerically wrong, programs attributed to the wrong city or year. This tool catches all of that.

The standard is not perfection — it's honesty. A pattern with a ★ confidence rating and three verified claims is better than a pattern with ★★ and six unverifiable ones. The tool should help calibrate confidence to what the evidence actually supports.

---

## Architecture

```
language-a/
├── tools/
│   ├── red-team/                # Already built — editorial review
│   ├── research-verify/
│   │   ├── verify.ts            # Main CLI entry point
│   │   ├── extractor.ts         # Extract claims from pattern text
│   │   ├── checker.ts           # Verify claims via web search
│   │   ├── prompt.ts            # System prompts for extraction and verification
│   │   ├── formatter.ts         # Terminal output formatting
│   │   ├── batch.ts             # Batch verification
│   │   └── types.ts             # TypeScript interfaces
│   └── tsconfig.json            # Shared with red-team
├── patterns/
└── data/
```

### Dependencies

Uses the same base as Red Team, plus:

```json
{
  "@anthropic-ai/sdk": "existing",
  "chalk": "existing",
  "commander": "existing",
  "gray-matter": "existing",
  "dotenv": "existing"
}
```

No new dependencies. The verification uses Claude's built-in web search tool via the Anthropic API.

---

## How It Works — Two-Pass Architecture

### Pass 1: Claim Extraction

The tool sends the pattern text to Claude and asks it to extract every verifiable claim into a structured list. A "claim" is any statement that could be checked against external sources:

**What counts as a claim:**
- Named statistics ("over 600 people died," "27% of workers," "costs 1% more")
- Named programs ("Philadelphia's Green City, Clean Waters program")
- Named legislation ("Minneapolis eliminated single-family-only zoning in 2018")
- Named studies ("Ward et al., 2017, Journal of the Association for Consumer Research")
- Named organizations ("International Dark-Sky Association")
- Historical assertions ("Vancouver's laneway housing program, implemented in 2009, has produced over 4,000 small dwellings")
- Technical specifications presented as fact ("a south-facing room with high-performance glazing can be 20°C warmer than outdoor temperatures")
- Quantitative assertions ("roughly 100,000 liters of rain per year on a typical Edmonton roof")

**What does NOT count as a claim:**
- Design principles ("create a physical threshold between workspace and living space")
- Subjective assessments ("the room should feel warm and inviting")
- Alexander's original pattern references (these are internal to the network, not external facts)
- Logical arguments ("if the power fails during a heat wave, mechanical cooling fails too")
- General common knowledge ("winter temperatures in Edmonton reach -30°C")

Each extracted claim gets a **claim type** classification:

```
STATISTIC    — a specific number, percentage, measurement, or quantity
CITATION     — a named study, paper, author, or publication
PROGRAM      — a named policy, initiative, law, or government action
ORGANIZATION — a named institution, company, or body
HISTORICAL   — a dated event or timeline claim
TECHNICAL    — an engineering or scientific specification presented as fact
```

### Pass 2: Claim Verification

Each extracted claim is verified individually via Claude with web search enabled. For each claim, the tool:

1. Searches for the specific claim
2. Evaluates what it finds against what the pattern asserts
3. Returns a verification status:

```
VERIFIED      — Found confirming source(s). Claim checks out.
PARTIALLY     — Core claim is directionally correct but details differ
                (e.g., "over 600 deaths" when the confirmed number is 595,
                or "2018" when it was actually 2019)
UNVERIFIED    — Could not find confirming or denying sources. Claim may be
                true but cannot be independently confirmed from web sources.
DISPUTED      — Found sources that contradict the claim
FABRICATED    — Strong evidence the claim is invented (paper doesn't exist,
                program was never implemented, organization is fictional)
```

**The critical distinction:** UNVERIFIED is not the same as FABRICATED. Many true claims are hard to verify from web search alone — especially technical specifications, regional statistics, or recent programs. The tool flags these honestly rather than making a false binary.

---

## CLI Interface

```bash
# Verify a single pattern (from JSON)
npx tsx tools/research-verify/verify.ts --json --id 16

# Verify a single pattern (from markdown)
npx tsx tools/research-verify/verify.ts patterns/016-heat-refuge-room.md

# Batch verify all patterns
npx tsx tools/research-verify/verify.ts --batch data/patterns.json

# Batch with summary only
npx tsx tools/research-verify/verify.ts --batch data/patterns.json --summary

# Extract claims only (no verification — useful for reviewing what will be checked)
npx tsx tools/research-verify/verify.ts --json --id 16 --extract-only

# Output as JSON
npx tsx tools/research-verify/verify.ts --json --id 16 --output json

# Verify with strict mode (flags UNVERIFIED as failures, not just DISPUTED/FABRICATED)
npx tsx tools/research-verify/verify.ts --json --id 16 --strict
```

---

## System Prompts

### Claim Extraction Prompt

```typescript
export function buildExtractionPrompt(): string {
  return `You are a fact-checking editor for Language A, a collection of design patterns for neighborhoods, buildings, and construction. Your job is to extract every verifiable factual claim from a pattern so each can be independently checked.

## What Counts as a Claim

Extract any statement that could be verified or falsified against external sources:

- STATISTIC: Specific numbers, percentages, measurements, quantities
  Example: "Average screen time for American adults reached seven hours and three minutes per day in 2024"
  
- CITATION: Named studies, papers, authors, publications, with or without dates
  Example: "Ward et al., 2017, Journal of the Association for Consumer Research"
  Example: "Terrapin Bright Green's '14 Patterns of Biophilic Design' (2014, updated 2024)"

- PROGRAM: Named policies, initiatives, laws, government actions with dates or outcomes
  Example: "Minneapolis eliminated single-family-only zoning in 2018"
  Example: "Portland permitted over 63,000 ADUs between 2018 and 2021"

- ORGANIZATION: Named institutions presented as doing or saying something specific
  Example: "The U.S. Surgeon General declared loneliness a public health epidemic in 2023"
  Example: "FEMA estimates that even one inch of floodwater causes $25,000 in damage"

- HISTORICAL: Dated events, timelines, founding dates
  Example: "Vancouver's laneway housing program, implemented in 2009, has produced over 4,000 small dwellings"

- TECHNICAL: Engineering or scientific specifications stated as fact
  Example: "A concrete floor slab attenuates signal by 15–20 dB"
  Example: "Heat recovery ventilation provides continuous fresh air while recovering 80–90% of heat"

## What to SKIP

Do NOT extract:
- Design principles or recommendations ("create a threshold between work and living space")
- Subjective assessments ("the room should feel warm")
- Internal pattern references ("...connects to THICK WALLS (197)...")
- Logical deductions ("if the power fails, mechanical cooling fails")
- General common knowledge that doesn't need verification ("Edmonton has cold winters")
- Aspirational statements ("every dwelling needs at least one room that...")

## Output Format

Return a JSON array of claims. Each claim has:
- "text": the exact quote from the pattern containing the claim
- "claim": the specific factual assertion to verify (distilled to its checkable core)
- "type": one of STATISTIC, CITATION, PROGRAM, ORGANIZATION, HISTORICAL, TECHNICAL
- "importance": "high" (the pattern's argument depends on this) or "low" (supporting detail)

Return ONLY the JSON array, no preamble, no markdown fences.

Example:
[
  {
    "text": "The U.S. Surgeon General declared loneliness a public health epidemic in 2023",
    "claim": "U.S. Surgeon General declared loneliness a public health epidemic in 2023",
    "type": "ORGANIZATION",
    "importance": "high"
  },
  {
    "text": "finding it as dangerous as smoking fifteen cigarettes a day",
    "claim": "Surgeon General's loneliness advisory compared health risk to smoking 15 cigarettes per day",
    "type": "STATISTIC",
    "importance": "high"
  }
]

Be thorough. Miss nothing. It is better to extract a claim that turns out to be common knowledge than to miss a fabricated statistic.`;
}
```

### Claim Verification Prompt

```typescript
export function buildVerificationPrompt(): string {
  return `You are a fact-checker verifying a specific claim from a design pattern document. You have web search available. Your job is to determine whether this claim is accurate.

## Verification Process

1. Search for the specific claim using relevant keywords
2. Look for primary sources (government reports, academic papers, official program pages) over secondary sources (blog posts, news aggregators)
3. Compare what you find to what the claim asserts
4. Return your verdict

## Verdict Categories

VERIFIED — You found one or more credible sources that confirm the claim as stated. The numbers match, the dates match, the attribution matches.

PARTIALLY — The core claim is directionally correct but specific details differ. Common cases:
- The number is close but not exact (claim says "over 600", sources say 595 or 619)
- The date is off by a year (claim says 2018, sources say 2019)
- The attribution is slightly wrong (claim says "Surgeon General declared", sources say "Surgeon General issued an advisory")
- The scope is different (claim says "U.S.", it was actually one state)
You MUST state what specifically differs.

UNVERIFIED — You searched but could not find sources that clearly confirm or deny the claim. This does NOT mean the claim is false — it may be true but not well-documented online, or it may be too recent, too local, or too technical for web sources to cover. Be honest about the limits of web search.

DISPUTED — You found credible sources that directly contradict the claim. The numbers are significantly wrong, the event didn't happen as described, or the attribution is incorrect. You MUST cite the contradicting source.

FABRICATED — Strong evidence the claim is invented. The cited paper does not exist in any database. The named program was never implemented. The organization is fictional. The statistic appears nowhere in any source. Reserve this for clear cases — not being able to find something is UNVERIFIED, not FABRICATED. FABRICATED means you found positive evidence of nonexistence (e.g., the journal exists but has no paper by that author, the city's website shows no record of the program).

## Output Format

Return a JSON object:
{
  "verdict": "VERIFIED" | "PARTIALLY" | "UNVERIFIED" | "DISPUTED" | "FABRICATED",
  "confidence": 0.0-1.0,
  "summary": "One sentence explaining your finding",
  "detail": "2-3 sentences with specifics. Name your sources. If PARTIALLY, state exactly what differs. If DISPUTED, cite the contradicting source. If UNVERIFIED, explain what you searched and why it was inconclusive.",
  "sources": ["URL or source description"]
}

Return ONLY the JSON object, no preamble, no markdown fences.

## Rules

- Never assume a claim is true because it sounds plausible. Search for it.
- Never assume a claim is false because you can't find it. UNVERIFIED is honest.
- For statistics, check the specific number — "approximately 27%" is different from "exactly 27%". Allow reasonable rounding.
- For citations, check that the paper/study actually exists AND says what the pattern claims it says. A real paper misrepresented is PARTIALLY, not VERIFIED.
- For programs, check both existence and outcomes. A real program with different outcomes than claimed is PARTIALLY.
- Primary sources beat secondary sources. A city's official report beats a news article about the report.
- If a claim references a specific year, verify the year. Off by one year is PARTIALLY with a note.
- Be especially skeptical of round numbers ("over 4,000", "roughly 100,000") — these are often approximations and should be treated generously if they're in the right ballpark.`;
}
```

---

## TypeScript Interfaces

```typescript
// types.ts

export type ClaimType = 
  | "STATISTIC" 
  | "CITATION" 
  | "PROGRAM" 
  | "ORGANIZATION" 
  | "HISTORICAL" 
  | "TECHNICAL";

export type ClaimImportance = "high" | "low";

export type VerificationVerdict = 
  | "VERIFIED" 
  | "PARTIALLY" 
  | "UNVERIFIED" 
  | "DISPUTED" 
  | "FABRICATED";

export interface ExtractedClaim {
  text: string;              // Exact quote from pattern
  claim: string;             // Distilled checkable assertion
  type: ClaimType;
  importance: ClaimImportance;
}

export interface VerificationResult {
  claim: ExtractedClaim;
  verdict: VerificationVerdict;
  confidence: number;        // 0.0–1.0
  summary: string;
  detail: string;
  sources: string[];
}

export interface PatternVerification {
  patternId: number;
  patternName: string;
  timestamp: string;
  model: string;
  totalClaims: number;
  results: VerificationResult[];
  summary: VerificationSummary;
}

export interface VerificationSummary {
  verified: number;
  partially: number;
  unverified: number;
  disputed: number;
  fabricated: number;
  highImportanceIssues: VerificationResult[];  // High-importance claims that aren't VERIFIED
  suggestedConfidenceImpact: string;           // How findings should affect confidence rating
}

export interface BatchVerificationSummary {
  total: number;
  patternsClean: number;            // All claims VERIFIED or PARTIALLY
  patternsWithIssues: number;       // At least one DISPUTED or FABRICATED
  patternsWithGaps: number;         // UNVERIFIED claims but nothing wrong
  totalClaims: number;
  claimBreakdown: {
    verified: number;
    partially: number;
    unverified: number;
    disputed: number;
    fabricated: number;
  };
  worstOffenders: {                 // Patterns with most issues
    patternId: number;
    patternName: string;
    disputed: number;
    fabricated: number;
  }[];
}
```

---

## Extractor Implementation

```typescript
// extractor.ts — key logic

export async function extractClaims(
  pattern: PatternInput,
  client: Anthropic
): Promise<ExtractedClaim[]> {
  
  // Combine all pattern text for extraction
  const patternText = [
    `# ${pattern.name}`,
    `**Problem:** ${pattern.problem}`,
    `**Evidence:** ${pattern.body}`,
    `**Therefore:** ${pattern.solution}`
  ].join('\n\n');

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    temperature: 0.1,          // Very low — extraction should be deterministic
    system: buildExtractionPrompt(),
    messages: [
      { role: "user", content: `Extract all verifiable claims from this pattern:\n\n${patternText}` }
    ]
  });

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');

  // Parse JSON, strip markdown fences if present
  const cleaned = text.replace(/```json\s*|```\s*/g, '').trim();
  return JSON.parse(cleaned) as ExtractedClaim[];
}
```

---

## Checker Implementation

```typescript
// checker.ts — key logic

export async function verifyClaim(
  claim: ExtractedClaim,
  client: Anthropic
): Promise<VerificationResult> {
  
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    temperature: 0.1,
    system: buildVerificationPrompt(),
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search"
      }
    ],
    messages: [
      { 
        role: "user", 
        content: `Verify this claim:\n\nType: ${claim.type}\nClaim: "${claim.claim}"\nOriginal text: "${claim.text}"\n\nSearch for evidence and return your verdict.`
      }
    ]
  });

  // Extract the final text response (after tool use blocks)
  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('');

  const cleaned = text.replace(/```json\s*|```\s*/g, '').trim();
  const result = JSON.parse(cleaned);

  return {
    claim,
    verdict: result.verdict,
    confidence: result.confidence,
    summary: result.summary,
    detail: result.detail,
    sources: result.sources || []
  };
}

export async function verifyAllClaims(
  claims: ExtractedClaim[],
  client: Anthropic,
  onProgress?: (completed: number, total: number) => void
): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];
  
  for (let i = 0; i < claims.length; i++) {
    const result = await verifyClaim(claims[i], client);
    results.push(result);
    
    if (onProgress) onProgress(i + 1, claims.length);
    
    // Rate limiting: 2-second delay between verification calls
    // (each call involves web search, so be more conservative than Red Team)
    if (i < claims.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}
```

---

## Terminal Output Format

```
═══════════════════════════════════════════════════════════
RESEARCH VERIFICATION — 16. Heat Refuge Room
═══════════════════════════════════════════════════════════

Claims extracted: 8
Verifying... ████████░░ 6/8

─── RESULTS ───────────────────────────────────────────────

✓ VERIFIED   "The 2021 Pacific Northwest heat dome killed over 600 people"
             Confirmed: BC Coroners Service reported 619 heat deaths in BC
             alone. Total across PNW estimated at 800+.
             Source: BC Coroners Service Death Review, 2022

~ PARTIALLY  "The 2023 Phoenix heat wave saw over 600 heat-associated deaths"
             Close: Maricopa County reported 645 heat-associated deaths in
             2023, but classification methodology was updated mid-count.
             Source: Maricopa County Dept of Public Health

✓ VERIFIED   "Heat is now the deadliest weather event in North America"
             Confirmed: CDC and NOAA data show heat as leading cause of
             weather-related mortality in U.S. since 2019.
             Source: CDC Environmental Health Tracking Network

? UNVERIFIED "The WHO recommends indoor noise levels below 35 dB for sleeping"
             Note: This claim appears in Pattern 32 (Acoustic Refuge), not
             this pattern. Possible cross-contamination in extraction.

✓ VERIFIED   [... remaining claims ...]

─── SUMMARY ───────────────────────────────────────────────

  VERIFIED:     5  ██████████████████████████████░░  71%
  PARTIALLY:    2  ████████░░░░░░░░░░░░░░░░░░░░░░░  29%
  UNVERIFIED:   1  ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░  14%
  DISPUTED:     0
  FABRICATED:   0

  HIGH-IMPORTANCE ISSUES: None

  CONFIDENCE IMPACT: Current ★★ is supported. Evidence is
  strong, multi-sourced, and largely verifiable. Minor
  numerical discrepancies are within acceptable range for
  approximations.

═══════════════════════════════════════════════════════════
VERDICT: CLEAN — pattern evidence is authentic
═══════════════════════════════════════════════════════════
```

**For a pattern with problems:**

```
═══════════════════════════════════════════════════════════
RESEARCH VERIFICATION — 42. [Hypothetical AI-Generated Pattern]
═══════════════════════════════════════════════════════════

Claims extracted: 6
Verifying... ██████████ 6/6

─── RESULTS ───────────────────────────────────────────────

✗ FABRICATED  "Chen et al., 2022, published in Nature Urban Sustainability"
             No paper by any author named Chen in Nature Urban Sustainability
             in 2022. The journal exists but contains no matching publication.
             Searched: Google Scholar, Nature journal archive
             ⚠ HIGH IMPORTANCE — pattern's core argument relies on this

✗ DISPUTED   "Portland's Green Ring initiative reduced urban heat island
             effect by 4.2°C in participating neighborhoods"
             Portland has a "Green Ring" trail concept but no heat island
             reduction program by that name. No 4.2°C figure appears in
             any Portland Bureau of Planning document.
             Source: Portland Bureau of Planning & Sustainability

~ PARTIALLY  "Singapore's Building and Construction Authority requires
             biophilic design in all new public housing"
             BCA has green building certification (Green Mark) that
             includes biophilic elements but does not "require" biophilic
             design specifically. Overstated.
             Source: BCA Green Mark 2021 criteria

─── SUMMARY ───────────────────────────────────────────────

  VERIFIED:     2  ██████████░░░░░░░░░░░░░░░░░░░░░  33%
  PARTIALLY:    1  █████░░░░░░░░░░░░░░░░░░░░░░░░░░  17%
  UNVERIFIED:   0
  DISPUTED:     1  █████░░░░░░░░░░░░░░░░░░░░░░░░░░  17%
  FABRICATED:   2  ██████████░░░░░░░░░░░░░░░░░░░░░  33%

  HIGH-IMPORTANCE ISSUES:
  ⚠ FABRICATED: Chen et al., 2022 — citation does not exist
  ⚠ DISPUTED:  Portland Green Ring heat reduction — program
               does not exist as described

  CONFIDENCE IMPACT: Pattern cannot hold any confidence
  rating until fabricated evidence is replaced with real
  sources. Current ★★ is not supportable. Recommend
  holding at ☆ until evidence is rebuilt from scratch.

═══════════════════════════════════════════════════════════
VERDICT: FAIL — 2 fabricated claims, 1 disputed
  Pattern must not be published until evidence is replaced.
═══════════════════════════════════════════════════════════
```

**Color coding:**
- VERIFIED: green ✓
- PARTIALLY: yellow ~
- UNVERIFIED: dim/gray ?
- DISPUTED: red ✗
- FABRICATED: red bold ✗ with ⚠ warning
- Verdict CLEAN: green
- Verdict CAUTION: yellow (has UNVERIFIED but nothing wrong)
- Verdict FAIL: red (has DISPUTED or FABRICATED)

---

## Verdict Logic

```typescript
function determineVerdict(results: VerificationResult[]): "CLEAN" | "CAUTION" | "FAIL" {
  const hasFabricated = results.some(r => r.verdict === "FABRICATED");
  const hasDisputed = results.some(r => r.verdict === "DISPUTED");
  const hasHighImportanceIssue = results.some(
    r => r.claim.importance === "high" && 
    (r.verdict === "UNVERIFIED" || r.verdict === "DISPUTED" || r.verdict === "FABRICATED")
  );

  if (hasFabricated || hasDisputed) return "FAIL";
  if (hasHighImportanceIssue) return "CAUTION";
  return "CLEAN";
}
```

**Verdict definitions:**
- **CLEAN:** All claims verified or partially verified. Pattern evidence is authentic. Publish confidence is supported.
- **CAUTION:** No fabricated or disputed claims, but high-importance claims are unverifiable. Pattern may be true but can't be independently confirmed. Consider downgrading confidence rating or adding hedging language.
- **FAIL:** At least one claim is disputed or fabricated. Pattern must not be published until evidence is corrected.

---

## Confidence Impact Assessment

After verification, the tool generates a confidence impact statement. This connects the research findings to the Red Team's confidence rating dimension:

```typescript
function assessConfidenceImpact(
  currentConfidence: number,
  results: VerificationResult[]
): string {
  const verified = results.filter(r => r.verdict === "VERIFIED").length;
  const partially = results.filter(r => r.verdict === "PARTIALLY").length;
  const total = results.length;
  const verifiedRate = (verified + partially * 0.5) / total;

  // High-importance claims carry more weight
  const highImportance = results.filter(r => r.claim.importance === "high");
  const highVerified = highImportance.filter(
    r => r.verdict === "VERIFIED" || r.verdict === "PARTIALLY"
  ).length;
  const highTotal = highImportance.length;

  // Suggested confidence based on evidence quality
  let suggested: number;
  if (highTotal === 0) {
    suggested = 0; // No verifiable high-importance claims — speculative
  } else if (highVerified === highTotal && verifiedRate >= 0.7) {
    suggested = 2; // All high-importance claims check out, most others too
  } else if (highVerified >= highTotal * 0.5 && verifiedRate >= 0.5) {
    suggested = 1; // Most high-importance claims hold, acceptable gaps
  } else {
    suggested = 0; // Too many gaps or contradictions
  }

  // Generate human-readable assessment
  if (suggested > currentConfidence) {
    return `Evidence is stronger than current ${starRating(currentConfidence)} suggests. ` +
           `Consider upgrading to ${starRating(suggested)}.`;
  } else if (suggested < currentConfidence) {
    return `Evidence does not support current ${starRating(currentConfidence)}. ` +
           `Recommend downgrading to ${starRating(suggested)} until additional sources are found.`;
  } else {
    return `Current ${starRating(currentConfidence)} is supported by the evidence.`;
  }
}
```

---

## Batch Mode

Batch verification is expensive — each pattern may have 5–10 claims, each requiring a web search API call. A full run of 254 patterns with ~7 claims each at 2-second intervals takes approximately **1 hour**.

```bash
# Full batch — runs all patterns, saves report
npx tsx tools/research-verify/verify.ts --batch data/patterns.json

# Batch summary only — still runs verification but only prints aggregate
npx tsx tools/research-verify/verify.ts --batch data/patterns.json --summary

# Batch with concurrency limit (default: 1 — sequential)
npx tsx tools/research-verify/verify.ts --batch data/patterns.json --concurrency 3
```

**Batch output:**

```
═══════════════════════════════════════════════════════════
BATCH VERIFICATION — 33 patterns, 231 claims
═══════════════════════════════════════════════════════════

Progress: ██████████████████████████████████░  33/33

PATTERN VERDICTS:
  CLEAN:    24  ████████████████████████░░░░░░░░░  73%
  CAUTION:   7  ███████░░░░░░░░░░░░░░░░░░░░░░░░░  21%
  FAIL:      2  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   6%

CLAIM VERDICTS:
  VERIFIED:    158  ████████████████████░░░░░░░░░░  68%
  PARTIALLY:    41  █████░░░░░░░░░░░░░░░░░░░░░░░░░  18%
  UNVERIFIED:   24  ███░░░░░░░░░░░░░░░░░░░░░░░░░░░  10%
  DISPUTED:      6  █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   3%
  FABRICATED:    2  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   1%

PATTERNS REQUIRING ATTENTION:
  ✗ #42  [Pattern Name]     — 1 fabricated, 1 disputed
  ✗ #67  [Pattern Name]     — 2 disputed
  ⚠ #19  [Pattern Name]     — 3 high-importance unverified
  ⚠ #31  [Pattern Name]     — 2 high-importance unverified

CONFIDENCE ADJUSTMENTS SUGGESTED:
  #42  ★★ → ☆   (fabricated evidence)
  #67  ★★ → ★   (disputed claims)
  #19  ★  → ☆   (unverifiable core evidence)
  #08  ★★ → ★★  (all evidence checks out — keep)

MOST RELIABLE PATTERNS (highest verification rates):
  #16  Heat Refuge Room         — 100% verified
  #01  15-Minute Neighborhood   —  92% verified
  #22  Building Envelope        —  89% verified

═══════════════════════════════════════════════════════════
Report saved: tools/research-verify/reports/verify-2026-02-13-223045.json
═══════════════════════════════════════════════════════════
```

Reports are saved as JSON to `tools/research-verify/reports/` with full structured data.

---

## Rate Limiting and Cost

**API calls per pattern:**
- 1 call for claim extraction
- N calls for claim verification (one per claim, each with web search)
- Typical pattern has 5–10 claims
- Average: ~8 API calls per pattern

**For 254 patterns:**
- ~2,032 API calls total
- At 2-second intervals: ~67 minutes for a full batch
- Sonnet pricing with web search: approximately $15–25 for a full batch run

**Optimization:** Cache verification results. If a pattern hasn't changed since its last verification, skip it. Store the hash of the pattern content alongside the report.

```typescript
// In verify.ts
import { createHash } from 'crypto';

function patternHash(pattern: PatternInput): string {
  const content = pattern.problem + pattern.body + pattern.solution;
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

// Before verifying, check if cached result exists with matching hash
// tools/research-verify/cache/pattern-{id}-{hash}.json
```

---

## Integration with Red Team

The two tools run in sequence. The combined quality gate:

```bash
# Full quality pipeline for a single pattern
npx tsx tools/red-team/review.ts --json --id 16        # Editorial review
npx tsx tools/research-verify/verify.ts --json --id 16  # Fact verification

# Or create a convenience script:
# tools/quality-gate.ts — runs both in sequence, fails if either fails
npx tsx tools/quality-gate.ts --json --id 16
```

**Build a convenience wrapper** (`tools/quality-gate.ts`):

```typescript
// Runs Red Team + Research Verification in sequence
// Returns combined report
// Exit code 0: both pass
// Exit code 1: Red Team fails (RETHINK)
// Exit code 2: Research fails (FAIL)
// Exit code 3: both fail

// Usage:
// npx tsx tools/quality-gate.ts --json --id 16
// npx tsx tools/quality-gate.ts --batch data/patterns.json
```

---

## Implementation Order

1. **types.ts** — interfaces
2. **prompt.ts** — extraction and verification system prompts
3. **extractor.ts** — claim extraction via API
4. **checker.ts** — claim verification via API with web search
5. **formatter.ts** — terminal output
6. **verify.ts** — main CLI entry point
7. **batch.ts** — batch mode with caching
8. **quality-gate.ts** — combined Red Team + Research Verification wrapper

---

## Validation Test

Run against three patterns after building:

### Pattern 16 (Heat Refuge Room) — expect CLEAN
Known claims to verify:
- "2021 Pacific Northwest heat dome killed over 600 people" → should VERIFY
- "2023 Phoenix heat wave saw over 600 heat-associated deaths" → should VERIFY or PARTIALLY
- "Heat is the deadliest weather event in North America" → should VERIFY

### Pattern 1 (The Fifteen-Minute Neighborhood) — expect CLEAN
Known claims:
- "Carlos Moreno's research at the Sorbonne" → should VERIFY
- "Paris, Melbourne, and Portland have restructured planning" → should VERIFY
- "Minneapolis eliminated single-family-only zoning in 2018" → wait, this is in Pattern 12 (The Missing Middle), but check the extraction doesn't cross-contaminate

### Pattern 25 (The Edible Landscape) — expect CLEAN or CAUTION
This pattern is thin on evidence (which is why Red Team flags it as RETHINK). The Research Verification should find few claims to extract, and the ones it finds should be general enough to verify. The lack of specific evidence is the Red Team's problem, not the Research Agent's.

**The key insight:** A pattern can pass Research Verification (no fabricated evidence) and still fail Red Team (no *sufficient* evidence). These are complementary checks, not redundant ones. Red Team asks "is there enough evidence?" Research asks "is the evidence real?"

---

## What This Does NOT Do

- Does not generate or suggest replacement evidence. It verifies what exists.
- Does not evaluate design quality, voice, or spatial specificity. That's Red Team's job.
- Does not modify patterns. It reports findings. The human decides what to fix.
- Does not replace Andrew's judgment. It amplifies it by doing the search work.
- Does not verify common knowledge or design principles — only factual claims against external sources.
- Does not guarantee accuracy. Web search has limits. UNVERIFIED means the tool couldn't confirm, not that the claim is false. Andrew's domain expertise is the final authority, especially on technical and cold-climate claims where web sources may be sparse.
