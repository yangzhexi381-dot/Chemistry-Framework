# N₂O₄(g) ⇌ 2 NO₂(g): fixed-T, fixed-V ideal-gas model

Model ID: `n2o4.isothermal_ideal_gas.v1` · Teaching/reproducible calculation · 2026-11-17

## Chemical question

In a rigid, sealed container at specified temperature, how do the partial pressures, reaction quotient, composition, and net reaction direction evolve toward equilibrium? What information comes from equilibrium thermodynamics, and what must be supplied by a kinetic model?

This model uses the **real chemical species and stoichiometry**, but ideal-gas and single-step phenomenological kinetic approximations. It is not an experimental fit or a validated N₂O₄/NO₂ photochemical or atmospheric model.

## System and units

- Reaction: `N₂O₄(g) ⇌ 2 NO₂(g)`.
- Closed, rigid, isothermal vessel; only these gas species; no spatial gradients, no other reactions or phase transitions.
- Input `T [K]`, `V [m³]`, `n₄(0), n₂(0) [mol]`, thermodynamic `K°(T)` [dimensionless], positive phenomenological rate scale `κ [mol m⁻³ s⁻¹]`, `t_end [s]`.
- Standard pressure `p° = 100,000 Pa = 1 bar`. Ideal gas molar constant `R = 8.31446261815324 J mol⁻¹ K⁻¹`.
- GUI accepts V in liters and amount in millimoles and converts to SI within the UI only. Numerics in `src/models/n2o4-ideal-gas.js` are SI-only.

## Thermodynamics and stoichiometry

For ideal gases:

`pᵢ = nᵢ R T / V` in Pa, `aᵢ = pᵢ/p°` dimensionless.

`Q = a₂²/a₄` and `ΔᵣG = RT ln(Q/K°)` in J mol⁻¹, with species index 2 = NO₂ and 4 = N₂O₄. At the zero-amount boundary, logarithm can be ±Infinity; this reflects the ideal-mixture limit, not a numerical failure.

With extent ξ [mol]: `n₄(t) = n₄(0) − ξ(t)`, `n₂(t) = n₂(0) + 2ξ(t)`, so the invariant `N = 2n₄ + n₂` [mol of NO₂-equivalent units] is conserved. Constraint `−n₂(0)/2 ≤ ξ ≤ n₄(0)` ensures nonnegative amounts.

Let `s = RT/(Vp°)` [mol⁻¹]. The equilibrium relation gives:

`s (N − 2n₄,eq)² / n₄,eq = K°`.

Equivalently:

`4s n₄,eq² − (4sN + K°) n₄,eq + sN² = 0`.

Use the **stable physical root**:

`n₄,eq = 2sN² / [4sN + K° + sqrt(K°² + 8K°sN)]`.

Then `n₂,eq = N − 2n₄,eq`. This independent analytical balance is used as an integration benchmark.

**Thermodynamic interpretation:** The reaction equilibrium condition is `ΔᵣG=0`. At constant T and V, the appropriate equilibrium extremum for the closed system is **Helmholtz free energy** (not minimization of total Gibbs energy at constant V).

## Kinetic closure and numerical algorithm

A deliberately specified reversible phenomenological rate density [mol m⁻³ s⁻¹]:

`r = κ [K° a₄ − a₂²]`.

Its rates are nonnegative in each direction, and its ratio is chosen to enforce equilibrium at the supplied `K°`. This is *not* a literature-measured rate law. It is a compatible teaching closure. ODEs:

`dn₄/dt = −Vr`, `dn₂/dt = 2Vr`, or `dξ/dt = Vr`.

Integrate the extent with 4th-order Runge–Kutta (RK4). To preserve stability across UI settings, the timestep is subdivided by a conservative upper bound on the local relaxation rate:

`L = V κ (K°s + 4s²N)` [s⁻¹]; choose `h L ≤ 0.20`.

If more than 250,000 integration steps would be required, an explanatory error is emitted rather than silently using an unreliable large step. After integration, only floating-point roundoff is projected onto the nonnegative stoichiometric interval.

## Important limitations

1. `K°` is **specified for the current T**. Changing T does not invoke van 't Hoff's equation or retrieve ΔᵣH°/heat-capacity data; any T→K° relation requires independent evidence.
2. `κ` is user-assigned. Curves are **model predictions conditional on this assumed κ**, not measured clock-time reaction rates. Both forward and reverse kinetic coefficients are simplified phenomenological choices.
3. Ideal-gas behavior, absence of temperature rise from reaction heat, and absence of diffusion limitations may fail in real experiments. `NO₂` dimerization can involve complex gas chemistry and photochemistry; these are excluded.
4. The analytical equilibrium root is based on material balance plus `K°`; it does not establish true species-specific rate constants. Use sources and experimental conditions before quantitative comparison with lab data.
5. Because ν_total changes by +1, dimensional `p₂²/p₄` cannot directly replace `Q`; the standard-pressure factors are essential.

## Verification rules

- Mass balance `|2n₄+n₂−N|` must be within floating-point tolerance at every time point.
- All output amounts and partial pressures must be nonnegative.
- For equilibrium root, `|Q/K°−1|` must be below a numerical tolerance.
- Net rate sign must match `−sign[ln(Q/K°)]` away from equilibrium, for this rate model.
- Relaxation time changes when κ changes while the analytical equilibrium is invariant.
- RK4 output must converge under step refinement for a nontrivial trajectory.
- SI conversion: 1 L = 10⁻³ m³, 1 mmol = 10⁻³ mol, 1 bar = 10⁵ Pa.

## Sources

- IUPAC Gold Book, *equilibrium constant*, https://goldbook.iupac.org/terms/view/E02177
- IUPAC Gold Book, *standard equilibrium constant*, https://goldbook.iupac.org/terms/view/S05915
- IUPAC Gold Book, *chemical equilibrium*, https://goldbook.iupac.org/terms/view/C01023

Sources support standard equilibrium thermodynamic definitions; the chosen κ and starting amounts are explicit demo assumptions, **not values quoted from IUPAC**.

## Numerical audit (v0.4.1)

The equilibrium evaluator now computes both species with independent stable expressions. With z=K°/(sN), n₄=2N/[4+z+√z√(z+8)] and n₂=2N/[1+√(1+8/z)]. This avoids subtracting nearly equal amounts. The extent integrator supports finite derived scales and 10⁻¹² ≤ z ≤ 10¹²; outside this numerical domain it throws, rather than returning a false equilibrium. This is a floating-point support boundary, not a physical law. Very small minor-species amounts reconstructed from extent still lose relative precision.

Regression tests additionally check the sign of dA/dt=ΔᵣG·dξ/dt and monotonic Helmholtz free energy in both reaction directions. Failed UI calculations clear stale readouts and curves.

Finite raw inputs alone do not guarantee finite intermediate arithmetic. Sample evaluation additionally rejects non-finite pressures, activities and rates, and invalid quotient/logarithm outputs away from genuine zero-amount boundaries. Q or ΔᵣG infinities are permitted only at physical ideal-mixture boundaries; unsupported overflow raises an explicit error.
