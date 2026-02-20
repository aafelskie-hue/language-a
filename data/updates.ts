export interface UpdateEntry {
  id: string;
  date: string; // ISO date for sorting (e.g., "2026-01-15")
  title: string;
  body: string; // Supports \n\n for paragraph breaks
}

export const updates: UpdateEntry[] = [
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
