---
id: 237
name: "The Sump Backup"
scale: "building"
category: "water-infrastructure"
categoryLabel: "Patterns for Water and Infrastructure"
confidence: 0
status: "candidate"
connections_up: [116, 121, 17]
connections_down: [69, 68]
coldClimate: false
tags: ["sump-pump", "backup-power", "flood-protection", "basement", "resilience", "water-management"]
---

# 237. The Sump Backup [☆]

**…beyond The Resilience Network (116), The Battery Bank (121), and Flood-Adaptive Ground Floor (17)…**

**When a storm drops heavy rain and cuts the power simultaneously — as storms do — the sump pump fails at the exact moment it is needed most. The basement fills with water while the homeowner watches helplessly. The pump depends on electricity to run; the outage removes the electricity; the water rises. This is not bad luck. It is a design failure built into every sump installation that lacks backup power.**

Sump pumps are the invisible infrastructure of basements in wet climates. In cities built on clay soils with high water tables — Edmonton, Toronto, much of the northern Great Plains and Great Lakes — the sump pit collects groundwater that would otherwise rise through the basement floor, and the pump ejects it before it becomes a flood. The system works well ninety-nine percent of the time. But the one percent when it fails — during the thunderstorm that also takes out the power, during the spring melt when the grid is stressed, during the ice storm that downs transmission lines for days — that one percent causes nearly all the damage.

Insurance industry data consistently shows that water damage is the most common and costly homeowner claim, and that basement flooding during power outages represents a large fraction of those losses. The Insurance Bureau of Canada has documented that a single basement flood typically costs $20,000 to $40,000 in damage — not counting lost possessions, mold remediation, or the weeks of displacement. A battery backup sump pump costs $500 to $1,500 installed. The arithmetic is not subtle.

The traditional solutions have limitations. A water-powered backup pump — which uses municipal pressure to drive a secondary pump — works only where water pressure is reliable and high enough, and wastes potable water. A generator can power the primary pump, but generators require fuel, maintenance, manual starting, and outdoor placement with proper ventilation. The battery backup is the simplest solution: a deep-cycle battery (marine or purpose-built), a charger that keeps it ready, and a DC pump or inverter that runs the primary pump when AC power fails. Modern lithium systems can provide 8-24 hours of pumping capacity, enough to outlast most outages.

The pattern intersects with larger resilience systems. The Battery Bank (121) may already provide whole-house backup; if so, ensure the sump circuit is on the critical-load panel. If not, a dedicated sump backup is simpler and cheaper than whole-house storage for this single purpose. The Flood-Adaptive Ground Floor (17) addresses what happens if water does enter; this pattern addresses preventing that entry in the first place. Freeze-Proof Plumbing (69) shares the same logic: design for the failure mode, not the normal condition.

**Therefore: in any building with a sump pump, install a battery backup system capable of running the pump for at least twelve hours without grid power. Use either a dedicated DC backup pump with its own battery, or an inverter system that powers the primary pump from battery storage. Size the battery for the pump's worst-case cycle rate — typically 3-5 minutes on, 10-15 minutes off during heavy rain. Mount the battery above the expected high-water line in the sump pit area. Install an audible alarm that sounds when the primary pump fails or when the backup activates. Test the system quarterly: unplug the primary pump, let the pit fill, and confirm the backup activates and pumps successfully. The test takes five minutes. The alternative costs tens of thousands.**

**…this pattern connects to Freeze-Proof Plumbing (69), for routing water systems to survive power failures, and The Visible Utility (68), for making this critical infrastructure accessible and testable…**