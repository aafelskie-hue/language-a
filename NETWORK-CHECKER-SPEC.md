# Network Integrity Checker — Implementation Spec

## INSTRUCTIONS FOR CLAUDE CODE

Build a CLI tool that analyzes the full Language A pattern network for structural integrity. This runs after new patterns are added — it checks that the 254-pattern graph is healthy, coherent, and actually functions as a language rather than a list.

This is the final structural gate. Red Team checks individual pattern quality. Research Verification checks individual facts. The Network Checker ensures the *whole* holds together.

---

## Architecture

```
language-a/
├── tools/
│   ├── red-team/                    # Built
│   ├── research-verify/             # Built
│   ├── quality-gate.ts              # Built
│   ├── category-planner/            # Built
│   ├── pattern-generator/           # To be built
│   ├── network-checker/
│   │   ├── checker.ts               # Main CLI entry point
│   │   ├── graph.ts                 # Build and analyze the pattern graph
│   │   ├── metrics.ts               # Network metrics calculations
│   │   ├── chains.ts                # Vertical chain analysis
│   │   ├── formatter.ts             # Terminal output + optional visualization
│   │   └── types.ts                 # TypeScript interfaces
│   └── tsconfig.json                # Shared
├── data/
│   └── patterns.json                # All patterns (existing + newly published)
└── reports/
    └── network-report-{date}.json   # Full network analysis report
```

### Dependencies

No new dependencies.

---

## What It Checks

### 1. Orphan Detection

Every pattern must connect to at least 3 other patterns. An orphan is a pattern with fewer than 3 connections — it's floating loose, not part of the language.

```
ORPHANS (< 3 connections):
  ✗ Pattern 147: The Tool Library — 1 connection (only to 295)
  ✗ Pattern 203: Frost Heave Prevention — 2 connections (to 275, 197)
```

**Why this matters:** Alexander's language works because every pattern is embedded in a web. You can enter at any point and follow connections to discover related patterns. An orphan breaks the web — a user who lands on it has nowhere to go.

### 2. Dead References

Connections that point to pattern IDs that don't exist. This happens when:
- A pattern references a future pattern that was never written
- A pattern ID was renumbered but references weren't updated
- The generator hallucinated a pattern ID

```
DEAD REFERENCES:
  ✗ Pattern 34 → Pattern 293 (does not exist)
  ✗ Pattern 12 → Pattern 310 (does not exist)
```

### 3. Scale Flow

The language should flow from large to small: neighborhood → building → construction. The checker measures:

- **Downward connections:** What percentage of neighborhood patterns connect to at least one building pattern? What percentage of building patterns connect to at least one construction pattern?
- **Upward connections:** What percentage of building patterns connect back to at least one neighborhood pattern? Construction to building?
- **Scale isolation:** Are any patterns connected ONLY to patterns at the same scale? (Bad — breaks the vertical flow.)

```
SCALE FLOW:
  Neighborhood → Building:  87% (target: >80%)  ✓
  Building → Construction:  72% (target: >70%)  ✓
  Scale-isolated patterns:  3                    ⚠
    Pattern 89 (building) — connects only to other building patterns
    Pattern 201 (construction) — connects only to other construction patterns
    Pattern 44 (neighborhood) — connects only to other neighborhood patterns
```

### 4. Vertical Chain Completeness

A vertical chain is a sequence: one neighborhood pattern → one or more building patterns that implement it → one or more construction patterns that detail those. A complete language should have many such chains.

```
VERTICAL CHAINS:
  Complete (N→B→C):  58 chains      ✓
  Broken (N→B only): 12 chains      ⚠ (missing construction detail)
  Broken (B→C only):  8 chains      ⚠ (missing neighborhood context)
  Floating (no chain): 4 patterns   ✗

  STRONGEST CHAINS:
  1. Fifteen-Minute Neighborhood (N) → Corner Store (B) → Shopfront Threshold (C)
  2. Building Envelope as Climate System (B) → Frost-Protected Foundation (C)
  3. Community Energy Commons (N) → Solar Gain Room (B) → Thermal Mass Floor (C)

  BROKEN CHAINS NEEDING ATTENTION:
  1. The Tool Library (N) → ??? → ??? (no building or construction patterns)
  2. ??? → Heritage Retrofit (B) → ??? (no neighborhood context, no construction detail)
```

### 5. Category Balance

How evenly are patterns distributed across the 10 categories? Are any categories starving while others bloat?

```
CATEGORY BALANCE:
  I.   Fifteen-Minute Life     28 (11%)  ████████████░░░░  ✓
  II.  Digital Age Dwelling    30 (12%)  █████████████░░░  ✓
  III. Housing Diversity       25 (10%)  ██████████░░░░░░  ✓
  IV.  Climate Resilience      30 (12%)  █████████████░░░  ✓
  V.   Energy & Envelope       25 (10%)  ██████████░░░░░░  ✓
  VI.  Food & Water            20 (8%)   ████████░░░░░░░░  ✓
  VII. Adaptive Reuse          22 (9%)   █████████░░░░░░░  ✓
  VIII.Health & Biophilia      25 (10%)  ██████████░░░░░░  ✓
  IX.  Community Governance    25 (10%)  ██████████░░░░░░  ✓
  X.   Construction & Making   24 (9%)   █████████░░░░░░░  ✓

  Balance score: 0.92 (1.0 = perfectly even, 0.0 = all in one category)
```

### 6. Hub Detection

Patterns with too many connections (>8) may be doing too much. They might need to be split into two patterns, or some connections might be thematic rather than structural.

```
HUBS (> 8 connections):
  ⚠ Pattern 1: Fifteen-Minute Neighborhood — 14 connections
    Consider: Is this a genuine hub, or are some connections thematic?
  ⚠ Pattern 22: Building Envelope — 11 connections
    Consider: Split into separate envelope patterns (walls, roof, foundation)?
```

### 7. Clustering

Are there clusters of tightly connected patterns with few connections to the rest of the network? This indicates subcommunities that aren't well-integrated.

```
CLUSTERS:
  Cluster A: Patterns 277, 278, 279, 170, 172 (food/garden patterns)
    Internal connections: 12
    External connections: 4
    Ratio: 0.33 — ⚠ somewhat isolated

  Cluster B: Patterns 258, 259, 260, 261, 262, 263 (digital/home patterns)
    Internal connections: 18
    External connections: 11
    Ratio: 0.61 — ✓ well-integrated
```

### 8. Reciprocity Check

If Pattern A lists Pattern B in its connections, does Pattern B list Pattern A? Not all connections need to be reciprocal (a construction pattern might reference a neighborhood pattern without the reverse), but a low reciprocity rate suggests sloppy connection management.

```
RECIPROCITY:
  Total directed connections: 1,248
  Reciprocal pairs: 487 (78%)   ✓ target >70%
  One-way connections: 137 (22%)
  
  ONE-WAY CONNECTIONS OF CONCERN:
  Pattern 34 → Pattern 1 (but 1 doesn't reference 34)
  Pattern 88 → Pattern 275 (but 275 doesn't reference 88)
```

### 9. Alexander Integration

How well does Language A connect to Alexander's original 253? Each Language A pattern should reference at least one Alexander pattern (either as a pattern it extends, updates, or fills a gap alongside).

```
ALEXANDER INTEGRATION:
  Patterns with Alexander references: 201/254 (79%)  ✓
  Patterns with no Alexander connection: 53
  Most-referenced Alexander patterns:
    1. Alexander 159 (Light on Two Sides): referenced by 12 Language A patterns
    2. Alexander 105 (South Facing Outdoors): referenced by 9
    3. Alexander 197 (Thick Walls): referenced by 8
  
  Unreferenced Alexander patterns that could connect:
    Alexander 37 (House Cluster) — relevant to Language A Missing Middle cluster
    Alexander 94 (Sleeping in Public) — relevant to Language A public space patterns
```

---

## CLI Interface

```bash
# Full network analysis
npx tsx tools/network-checker/checker.ts

# Quick summary only
npx tsx tools/network-checker/checker.ts --summary

# Check specific patterns (after adding new ones)
npx tsx tools/network-checker/checker.ts --focus 34,35,36,37

# Compare before and after (show what changed)
npx tsx tools/network-checker/checker.ts --compare reports/network-report-prev.json

# Export as JSON
npx tsx tools/network-checker/checker.ts --output json

# Check against catalog plan (flag plan slots that would create orphans)
npx tsx tools/network-checker/checker.ts --plan data/catalog-plan.json
```

---

## Terminal Output

```
═══════════════════════════════════════════════════════════
NETWORK INTEGRITY CHECK — 254 patterns
═══════════════════════════════════════════════════════════

CONNECTIVITY
  Total connections:     1,248
  Average per pattern:   4.9 (target: 4-6)    ✓
  Orphans (< 3):         2                     ⚠
  Hubs (> 8):            3                     ⚠

SCALE FLOW
  Neighborhood → Building:    87%              ✓
  Building → Construction:    72%              ✓
  Scale-isolated:             3 patterns       ⚠

VERTICAL CHAINS
  Complete (N→B→C):           58               ✓
  Broken:                     20               ⚠
  Floating:                   4                ✗

CATEGORY BALANCE
  Balance score:              0.92/1.00        ✓
  Smallest: Food & Water (20)
  Largest: Climate Resilience (30)

NETWORK QUALITY
  Reciprocity:                78%              ✓
  Dead references:            0                ✓
  Clustering health:          0.71             ✓
  Alexander integration:      79%              ✓

───────────────────────────────────────────────────────────

ISSUES REQUIRING ATTENTION:

  ✗ ORPHANS (2):
    Pattern 147: The Tool Library — 1 connection
    Pattern 203: Frost Heave Prevention — 2 connections

  ⚠ HUBS (3):
    Pattern 1: 14 connections
    Pattern 22: 11 connections
    Pattern 275: 9 connections

  ⚠ SCALE-ISOLATED (3):
    Pattern 89, 201, 44

  ✗ BROKEN CHAINS — top 5 needing repair:
    1. Tool Library (N) → [no B] → [no C]
    2. Heritage Retrofit (B) → [no C detail]
    3. [no N context] → Acoustic Refuge (B) → [no C]
    4. Community Land Trust (N) → [no B] → [no C]
    5. [no N] → Zoom Room (B) → [no C detail]

═══════════════════════════════════════════════════════════
VERDICT: HEALTHY with 7 issues
  2 critical (orphans, broken chains)
  5 advisory (hubs, scale isolation)
═══════════════════════════════════════════════════════════
Report saved: reports/network-report-2026-02-14.json
```

---

## TypeScript Interfaces

```typescript
// types.ts

export interface NetworkNode {
  id: number;
  name: string;
  scale: "neighborhood" | "building" | "construction";
  category: string;
  connectionsUp: number[];
  connectionsDown: number[];
  allConnections: number[];
  alexanderRefs: number[];
  connectionCount: number;
}

export interface NetworkEdge {
  from: number;
  to: number;
  direction: "up" | "down";
  reciprocal: boolean;
}

export interface VerticalChain {
  neighborhood: number[];    // Pattern IDs at neighborhood scale
  building: number[];        // Pattern IDs at building scale
  construction: number[];    // Pattern IDs at construction scale
  complete: boolean;         // Has at least one at each scale
  strength: number;          // 0-1 based on connection density
}

export interface NetworkCluster {
  patterns: number[];
  internalConnections: number;
  externalConnections: number;
  ratio: number;            // external / (internal + external)
  isolated: boolean;        // ratio < 0.3
}

export interface NetworkReport {
  timestamp: string;
  totalPatterns: number;
  
  connectivity: {
    totalConnections: number;
    averagePerPattern: number;
    orphans: { id: number; name: string; connections: number }[];
    hubs: { id: number; name: string; connections: number }[];
  };
  
  scaleFlow: {
    neighborhoodToBuilding: number;    // percentage
    buildingToConstruction: number;
    scaleIsolated: { id: number; name: string; scale: string }[];
  };
  
  verticalChains: {
    complete: VerticalChain[];
    broken: VerticalChain[];
    floating: number[];                // Pattern IDs not in any chain
  };
  
  categoryBalance: {
    distribution: { [category: string]: number };
    balanceScore: number;              // 0-1
  };
  
  reciprocity: {
    totalDirected: number;
    reciprocalPairs: number;
    reciprocityRate: number;
    oneWay: { from: number; to: number }[];
  };
  
  clusters: NetworkCluster[];
  
  alexanderIntegration: {
    patternsWithRefs: number;
    patternsWithoutRefs: number;
    mostReferenced: { alexanderId: number; count: number }[];
    suggestedConnections: { languageAId: number; alexanderId: number; reason: string }[];
  };
  
  deadReferences: { from: number; to: number }[];
  
  verdict: "HEALTHY" | "ISSUES" | "CRITICAL";
  criticalCount: number;
  advisoryCount: number;
  issues: {
    severity: "critical" | "advisory";
    type: string;
    description: string;
    affectedPatterns: number[];
  }[];
}
```

---

## Graph Analysis (No AI Required)

Unlike the other tools, the Network Checker is primarily algorithmic — no API calls needed. It builds a graph from `patterns.json` and runs standard network analysis:

```typescript
// graph.ts — pure computation, no API calls

export function buildGraph(patterns: PatternInput[]): {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
} {
  // Build adjacency list from pattern connections
}

export function findOrphans(nodes: NetworkNode[]): NetworkNode[] {
  return nodes.filter(n => n.connectionCount < 3);
}

export function findHubs(nodes: NetworkNode[]): NetworkNode[] {
  return nodes.filter(n => n.connectionCount > 8);
}

export function findDeadReferences(
  nodes: NetworkNode[], 
  edges: NetworkEdge[]
): { from: number; to: number }[] {
  const ids = new Set(nodes.map(n => n.id));
  return edges.filter(e => !ids.has(e.to));
}

export function calculateReciprocity(edges: NetworkEdge[]): number {
  // For each edge A→B, check if B→A exists
}

export function findVerticalChains(
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): VerticalChain[] {
  // BFS/DFS from neighborhood nodes, following down-connections
  // through building to construction
}

export function detectClusters(
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): NetworkCluster[] {
  // Simple community detection — connected components
  // then measure internal vs external connection ratio
}

export function measureScaleFlow(
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): { neighborhoodToBuilding: number; buildingToConstruction: number } {
  // Percentage of N nodes with at least one edge to a B node
  // Percentage of B nodes with at least one edge to a C node
}

export function calculateBalanceScore(
  distribution: { [category: string]: number }
): number {
  // Normalized entropy: 1.0 = perfectly even, 0.0 = all in one category
  const values = Object.values(distribution);
  const total = values.reduce((a, b) => a + b, 0);
  const maxEntropy = Math.log(values.length);
  const entropy = -values.reduce((sum, v) => {
    const p = v / total;
    return p > 0 ? sum + p * Math.log(p) : sum;
  }, 0);
  return entropy / maxEntropy;
}
```

This means the Network Checker is:
- **Free** — no API costs
- **Fast** — runs in milliseconds
- **Deterministic** — same input always produces same output
- **Runnable on every commit** — could be a pre-push hook

---

## Optional: AI-Assisted Suggestions

One optional AI-powered feature: after the algorithmic analysis, send the orphans and broken chains to Claude and ask it to suggest specific connections that would fix them.

```bash
# Run with AI suggestions
npx tsx tools/network-checker/checker.ts --suggest
```

This adds a section to the report:

```
SUGGESTED FIXES (AI-assisted):

  Orphan: Pattern 147 (The Tool Library)
  Suggested connections:
    → Pattern 295 (The Maintenance Commons) — shared resources governance
    → Pattern 36 (The Neighborhood Workshop) — the physical space
    → Alexander 157 (Home Workshop) — the individual-scale counterpart
    
  Broken chain: Heritage Retrofit (B) missing construction detail
  Suggested new pattern:
    "Interior Insulation Assembly" (C) — vapor-permeable interior insulation
    for heritage buildings. Connects to Heritage Retrofit (281), Thick Walls
    (Alexander 197), Building Envelope (275).
```

This is optional — the core checker runs without AI. But for fixing issues, having concrete suggestions saves Andrew time.

---

## Implementation Order

1. **types.ts** — interfaces
2. **graph.ts** — build graph, core algorithms
3. **metrics.ts** — all network metric calculations
4. **chains.ts** — vertical chain detection and analysis
5. **formatter.ts** — terminal output
6. **checker.ts** — main CLI entry point

---

## Validation Test

After building, run against the current 33 patterns:

```bash
npx tsx tools/network-checker/checker.ts
```

**Expected findings for 33 patterns:**
- Several orphans (33 patterns can't all have 3+ connections to each other)
- Dead references (patterns referencing future patterns 293, 295)
- Incomplete vertical chains (only 8 categories filled, 2 empty)
- Scale imbalance (already known from analysis)
- Low Alexander integration (need to add refs)

These are known issues that the full 254-pattern build will fix. The checker confirms them quantitatively.

After the full 254 are written, run again — the numbers should be dramatically better. That's the proof that the pipeline works.

---

## Integration with CI / Git Hooks

Because the Network Checker is free and fast (no API calls), it can run on every push:

```bash
# In .husky/pre-push or CI pipeline
npx tsx tools/network-checker/checker.ts --summary
# Exit code 0: HEALTHY or ISSUES (advisory only)
# Exit code 1: CRITICAL (orphans or dead references)
```

This prevents anyone from pushing pattern changes that break the network.

---

## What This Does NOT Do

- Does not evaluate pattern quality. Red Team does that.
- Does not verify facts. Research Verification does that.
- Does not generate patterns. The Pattern Generator does that.
- Does not modify patterns. It reports issues. The human or generator fixes them.
- Does not require an API key (except for --suggest mode). The core analysis is pure graph computation.
