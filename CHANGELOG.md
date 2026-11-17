# Changelog

## v0.5.0-dev — unmerged (2026-11-17)

- Added frozen hydrogen 1s H₂⁺ LCAO integrals, symmetry solution of Hc=εSc, nuclear repulsion, BO energy curves and approximate density slices.
- Added independent spatial-quadrature and scientific consistency tests; documented basis error and numeric references.
- Added reversible electrochemical thermodynamics API as a technical reserve; no full cell dynamics or new electrochemical UI.
- Included v0.4.1 baseline fixes below.


## v0.4.1 — baseline audit (2026-11-17)

- Stabilized both analytical equilibrium species and rejected unsupported floating-point scales.
- Added extreme-input and Helmholtz-dissipation regression tests.
- Cleared stale UI results after invalid calculations.


## v0.4.0 — candidate (2026-11-17)

- Added dimensionally explicit N₂O₄ ⇌ 2NO₂ ideal-gas, fixed-T/V model with reaction extent, partial pressures, Q/K°, ΔᵣG, adjustable phenomenological rates and RK4 time evolution.
- Added independent analytical equilibrium solution and nine scientific/engineering regression tests.
- New interactive chart and controls while preserving the v0.3.2 normalized teaching demonstration.
- Added mathematical derivation, SI units, numerical-method bounds and IUPAC thermodynamic references.
- No assertion of literature-derived kinetic rates or experimental calibration. Pending hosted multi-device acceptance.

## v0.3.2 — candidate (2026-11-17)

- Fixed N₂O₄ UI direction classification to read `dgOverRT` returned by the kinetics model instead of undefined `dg`.
- Added regression checks for forward/reverse reaction, near-equilibrium, reaction stoichiometry, and the kinetic rate-scale parameter.
- Left the scientific equations and model parameters unchanged.
- Updated displayed version and live GitHub Pages URL; full multi-device browser acceptance is still pending.

## v0.3.1-github-starter — 2026-11-17

- Extracted CSS, knowledge data, three teaching models and UI controllers from the existing v0.3.1 single HTML file.
- Preserved browser functionality and source model behavior without claiming new science verification.
- Added README, public-only theory overview, scientific scope documentation, basic smoke tests and GitHub Pages deployment instructions.
- Excluded the internal v0.1.0 theory manuscript because it contains a private research case.
- Fixed two pre-existing JavaScript parsing issues in the inline app script (trailing comma before `let db`; orphaned duplicate mode-handler body).
- No third-party runtime dependency required.

### Acceptance record

See [QA report](docs/QA_REPORT.md) for the audited baseline, actual test results, viewport acceptance, independent review and outstanding limits. Browser acceptance is separate from the Node CI suite.
