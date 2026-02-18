---
id: 194
name: "The Heat Pump System"
scale: "building"
category: "energy-envelope"
categoryLabel: "Patterns for Energy and Envelope"
confidence: 1
status: "candidate"
connections_up: [193, 22]
connections_down: [195, 125, 126]
coldClimate: true
tags: ["heating", "cooling", "electrification", "cold-climate", "renewable-energy", "ground-source", "air-source"]
---

# 194. The Heat Pump System [★]

**…beyond The District Heating Loop (193) and Building Envelope as Climate System (22)…**

**When a building burns natural gas or oil for heat, it cannot be powered by renewable electricity, and so remains tethered to fossil fuels even as the grid decarbonizes. Yet electric resistance heating consumes three times the energy of a heat pump, and cold-climate winters have long been thought too severe for air-source systems. The tension: how do you heat a building at -30°C without combustion, without excessive electrical demand, and without a system that fails when you need it most?**

A heat pump moves heat rather than creating it — extracting warmth from outdoor air, ground, or water and concentrating it indoors. The physics are simple: for every unit of electricity consumed, a good heat pump delivers two to four units of heat. This coefficient of performance (COP) makes electrification practical where resistance heating would overwhelm the grid.

The cold-climate problem has been solved. Modern variable-speed air-source heat pumps now operate efficiently to -25°C and continue functioning to -30°C, though with reduced output. Natural Resources Canada's Cold Climate Air Source Heat Pump Challenge (2018-2021) tested units from Mitsubishi, Fujitsu, and others in Canadian winters, confirming rated performance at -15°C and measurable output at -25°C. The City of Edmonton's Clean Energy Improvement Program, launched in 2020, has financed hundreds of heat pump installations, generating field data on performance in Zone 4A winters. Ground-source (geothermal) systems sidestep the cold air problem entirely: at 2-3 meters depth, Edmonton's soil holds steady near 5°C year-round, providing a reliable heat source even when surface air drops to -35°C.

The envelope matters enormously. A heat pump sized for a poorly insulated house must be oversized, expensive, and inefficient at partial loads. But when Building Envelope as Climate System (22) has done its work — when the heating load is 80% below code baseline — a modest heat pump handles the remaining demand with grace. The Swedish Passive House standard, widespread since the 2000s, pairs extreme insulation (typically R-60 walls, R-100 roofs) with small air-source heat pumps rated at 2-3 kW, adequate for homes in climates as cold as Edmonton's. This pairing — envelope first, then right-sized heat pump — is the pattern's essential logic.

Where district heating exists, as in The District Heating Loop (193), heat pumps can serve as distributed sources, extracting heat from wastewater, exhaust air, or the ground and feeding it to the shared network. The Drake Landing Solar Community in Okotoks, Alberta (completed 2007), stores summer solar heat in a borehole field and retrieves it via heat pumps in winter, achieving over 90% solar heating fraction — proof that seasonal storage works at 51°N. Individual buildings connect to patterns below: The Wind Scoop (125) provides summer cooling ventilation that reduces heat pump runtime, while ground loops share infrastructure with other subsurface systems.

**Therefore: install an electric heat pump as the primary heating and cooling system. For air-source units, select a cold-climate rated system with a COP of at least 2.0 at -20°C. For ground-source, bore vertical loops to 60-100 meters or lay horizontal loops below the frost line at 2 meters minimum. Size the system after the envelope is designed — never before — and verify that heat pump capacity at the 1% design temperature (Edmonton: -33°C) meets at least 80% of the peak heating load, with electric resistance backup for the coldest hours only. Test: measure annual heating COP across a full winter; the system passes if seasonal COP exceeds 2.5 for ground-source or 2.0 for air-source.**

**…this pattern connects to The Mechanical Core (195), The Wind Scoop (125), and The Thermal Flywheel (126)…**