export interface UpdateEntry {
  id: string;
  date: string; // ISO date for sorting (e.g., "2026-01-15")
  title: string;
  body: string; // Supports \n\n for paragraph breaks
}

export const updates: UpdateEntry[] = [
  {
    id: '2026-04-guide-retrieval',
    date: '2026-04-03',
    title: 'The Guide reads the patterns now',
    body: `When we launched the AI Pattern Guide, it worked from a compressed index — pattern names, one-line summaries, and connection maps. Enough to point in the right direction, not enough to describe what the patterns actually say. The model was selecting patterns by title association and generating plausible explanations that didn't match the real content. It was confidently wrong, which is worse than being uncertain.

We rebuilt the Guide's architecture around a two-stage retrieval system. The first stage identifies which patterns are relevant to your question, working from the full index of 254 patterns. The second stage reads the complete text of those patterns — problem, evidence, solution, connections — before generating its response. The Guide now works from the same content you see on each pattern page.

The difference is structural. The Guide no longer invents what patterns say. When it cites Pattern 217: Freeze-Proof Plumbing for a basement bathroom, the advice comes from the pattern's actual resolution, not from a plausible guess about what a pattern with that name might contain. When the language doesn't cover something — basement waterproofing details, for instance — the Guide says so directly rather than stretching an unrelated pattern to fill the gap.

We also added streaming responses. The Guide's answers arrive as they're generated rather than appearing all at once. The experience is faster, even though the system is doing more work behind the scenes.

This is the kind of change that's invisible when it works. You ask a question, you get a grounded answer, you don't think about the retrieval architecture. That's the point.`,
  },
  {
    id: '2026-01-network-density',
    date: '2026-01-15',
    title: 'On network density and the three scales',
    body: `The network graph is working. What we've been looking at more carefully since launch is whether it's telling the right story.

Some patterns carry eight or nine connections. Others carry two. The instinct is to read that as structural — foundational patterns attracting more relationships because they are more foundational. That's probably true for some of them. But we've noticed a subtler effect: patterns written early in the process had more existing patterns to connect to, and patterns written later were connecting to a network that was already partly settled. Sequence may have shaped density in ways that don't reflect genuine importance.

We're not revising connections wholesale. What we're doing is reading the low-connection patterns more carefully — asking whether they're genuinely peripheral, or whether they were simply written late. A few are candidates for strengthening. We'll note specific changes here as they're made.

The second thing: the three-scale structure — Neighborhood, Building, Construction — is load-bearing for how Language A is organized, but we've found that first-time visitors often feel the categories before they understand them. The scales make intuitive sense once you're inside the language. The entry point could work harder. We're looking at how the landing experience frames the three scales before a visitor commits to exploring, and we'll update here when we make changes.

Both of these are the kind of thing a finished artifact wouldn't bother with. That's the point.`,
  },
];

export function groupUpdatesByMonth(
  entries: UpdateEntry[]
): Map<string, UpdateEntry[]> {
  // Sort reverse-chronological
  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Group by "Month Year"
  const grouped = new Map<string, UpdateEntry[]>();

  for (const entry of sorted) {
    const date = new Date(entry.date);
    const monthYear = date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    if (!grouped.has(monthYear)) {
      grouped.set(monthYear, []);
    }
    grouped.get(monthYear)!.push(entry);
  }

  return grouped;
}
