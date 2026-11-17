# Electrochemical model extension contract

Status: technical reserve; no complete cell, fitted kinetics or SOC simulation.

`CFModels.electrochemicalCell.reversible({temperatureK, electrons, standardEmfV, reactionQuotient})`
returns reversible `emfV [V]` and `deltaGJMol [J per mol of reaction as written]`.
The overall cell reaction must specify positive integer electron transfer n and an activity-based dimensionless Q; E° must correspond to that reaction and temperature.

Equations: E=E°−RT ln(Q)/(nF); ΔrG=−nFE. R=8.31446261815324 J mol⁻¹ K⁻¹, F=96485.33212 C mol⁻¹. These thermodynamic relationships do not determine actual loaded voltage. Q=0, negative activities, or non-finite values are rejected.

Future independent modules will accept explicitly sourced electrode reactions and standard potentials; exchange-current density, transfer coefficient and electrode area for kinetics; electrolyte resistance for ohmic loss; diffusion coefficients/geometry/boundaries for mass transport; species inventories and capacity for SOC dynamics. Their outputs must report each signed voltage contribution and the current/charge convention. No default measured parameters are supplied. A future adapter should return `{reversible, kineticLoss, ohmicLoss, transportLoss, state, evidence}` with units and provenance, and enforce mass/charge balances. This release does not instantiate that adapter or couple it to the lead-acid progress illustration.

Sources: IUPAC Gold Book equilibrium thermodynamics; NIST CODATA constants. Numeric tests use Q=1, a Nernst decade, ΔG/electrical-work consistency and equilibrium E=0. No electrochemical UI is claimed for this reserve API.
