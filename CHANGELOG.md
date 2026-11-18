# Changelog

## v0.5.0-dev — native structure chemistry simulations (2026-11-18)

- Added seven interactive structure chemistry simulations inside the existing scientific workbench without any new top-level tab.
- Extracted independent quantitative kernels and scoped rendering/styles; linked native theory cards to models and knowledge graph nodes.
- Added seven structure knowledge nodes, eight conditional connections and scientifically bounded cross-model explanations.
- Added precision and browser acceptance checks; original H₂⁺, electrochemical and kinetics calculations unchanged.


## v0.5.0-dev — unified module and theory layout (2026-11-18)

- Merged the electrochemistry and physical-model top-level navigation into one System & Models page without changing calculations or content.
- Consolidated existing electrochemistry Chapters 8–10 and kinetics deep-theory content in one Theory Tools container; retained original text, formulae and provenance.
- Preserved legacy electrochemistry, science-model and chapter routes, and added local/hosted browser acceptance for the layout and battery interactions.


## v0.5.0-dev — combine thermodynamics and kinetics view (2026-11-18)

- Unified thermodynamics and kinetics under the single map filter '热力学与动力学'.
- Removed 11.x prefixes from ten visible kinetic concept titles, graph labels and theory-unit headings; preserved the stable node IDs and source citations.
- Added regression checks for merged filter, numbering-free labels, legacy deep links and responsive browser navigation.


## v0.5.0-dev — shared knowledge across modules (2026-11-18)

- Linked all five main modules through shared concept and conditional-relation IDs.
- Added deep concept links from inquiry results, theory cards, electrochemical examples and scientific models.
- Removed visible textbook feature framing while retaining provenance and legacy links.
- Extended data and Chromium browser checks for cross-module interaction.


## v0.5.0-dev — consolidate curriculum under Theory Tools (2026-11-18)

- Removed redundant '教材知识' top-level tab. Chapter 11 learning content, search, self-checks and links now appear inside '理论工具'.
- Preserved legacy `#learn/pc.11.x` deep links by activating the parent Theory Tools page; visiting `#theory` also loads curriculum content.
- Added integration and optional browser regressions; scientific models and textbook datasets unchanged.

## v0.5.0-dev — Chapter 11 knowledge graph (2026-11-18)

- Connected all ten kinetics chapter sections to the homepage knowledge map, adding 10 provenance-labelled nodes and 14 typed, conditional relations.
- Added focused Chapter 11 graph view and direct, safe links from graph node details to textbook sections.
- Kept dependencies, conditional derivations and empirical relations distinct; added data/graph consistency regression checks.

## v0.5.0-dev — kinetics learning (2026-11-18)

- Integrated physical chemistry Chapter 11 (11.1–11.10): original teaching notes, equations, reasoning, source pages, boundaries and self-checks. Chapter 12 remains unpublished.
- Added searchable learning UI and stable section/model routes.
- Added chapter-11 completeness and search regression checks; future Chapter 12 links display as pending instead of leading to missing content. Retained existing scientific models.
- Scope, independent scientific review and actual checks recorded in docs/TEXTBOOK_INTEGRATION.md.


## v0.5.0-dev — H₂⁺ merged via PR #3 (2026-11-17)

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
