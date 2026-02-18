---
id: 195
name: "The Thermal Storage Tank"
scale: "building"
category: "energy-envelope"
categoryLabel: "Patterns for Energy and Envelope"
confidence: 1
status: "candidate"
connections_up: [193, 194, 126]
connections_down: [45, 121]
coldClimate: true
tags: ["thermal-storage", "heat-pump", "load-shifting", "resilience", "district-heating"]
---

# 195. The Thermal Storage Tank [★]

**…beyond The District Heating Loop (193), The Heat Pump System (194), and Passive Solar Design (126)…**

**When heating and cooling systems must generate their output the instant it is needed, they are sized for the worst hour of the worst day — and then sit oversized and inefficient the other 8,759 hours of the year. The heat pump runs hardest at 6 AM when electricity is most expensive and the grid most strained. The solar panels flood the house with thermal energy at noon when no one needs it, while the boiler fires at dusk when prices peak. Without a buffer between generation and use, the building pays twice: once for oversized equipment, and again for energy bought at the wrong time.**

Water holds 4,186 joules per kilogram per degree Celsius — more than four times the thermal capacity of concrete, sixty times that of air. A cubic meter of water, heated from 40°C to 80°C, stores 167 megajoules — enough to heat a well-insulated house through a cold Edmonton night. This is not theoretical; it is physics that northern Europeans have exploited for decades.

Denmark's district heating systems routinely incorporate thermal storage at building and neighborhood scale. The Marstal solar heating plant on the island of Ærø stores summer heat in a 75,000 cubic meter pit for winter use, achieving solar fractions above 55% at 55°N latitude — comparable to Edmonton. At the building scale, the Passivhaus Institut recommends stratified hot water tanks of 500 to 2,000 liters for single-family homes coupling heat pumps with solar thermal or photovoltaics. The key is stratification: hot water rises, cold sinks, and a tall tank maintains temperature layers that allow the heat pump to run at optimal efficiency while delivering 60°C water on demand.

In cold climates, thermal storage transforms the economics of heat pumps. A ground-source heat pump running at night, when Edmonton's off-peak electricity rates drop to 3-5 cents per kWh, can fill a storage tank for half the cost of daytime operation. EPCOR's regulated rate option shows winter peak prices exceeding 15 cents per kWh between 5-7 PM — the exact hours when heating demand spikes. A properly sized tank shifts this load entirely, running the heat pump during the cheap hours of midnight to 6 AM and coasting through the expensive evening on stored heat.

The tank also provides resilience that neither the heat pump nor the battery can match. When grid power fails at -30°C, a 2,000-liter tank at 70°C holds enough thermal energy to keep a small house above freezing for 24 to 48 hours — no electricity required, just the slow bleeding of stored warmth through a gravity-fed hydronic loop or radiant mass. This complements The Battery Bank (121), which keeps pumps and controls alive, but cannot itself generate heat.

Alexander's Pattern 201 (Waist-High Shelf) speaks to things that belong within reach, at the center of daily life. The thermal storage tank is its mechanical cousin — not hidden in a crawlspace but present in the utility room, its temperature gauge readable, its warmth palpable through the insulation, a visible reservoir against the cold.

**Therefore: install an insulated thermal storage tank sized to hold at least 12 hours of heating demand at design temperature. For a typical Edmonton house with a 10 kW peak load, this means a minimum of 1,500 liters, stratified, insulated to R-30 or better, with connections for the heat pump, solar thermal (if present), and hydronic distribution. Place the tank vertically to maintain stratification — height should exceed diameter by at least 2:1. Connect the heat pump to the lower third of the tank (cold return), and draw hot water from the top. Install a simple analog thermometer at eye level showing tank temperature at three heights. The test: on the coldest night of winter, turn off the heat pump at 10 PM with the tank fully charged; the house should remain above 16°C until 6 AM on stored heat alone.**

**…this pattern connects to Thermal Mass (45), which distributes stored heat through the building fabric, and The Battery Bank (121), which keeps controls and pumps running when the grid fails…**