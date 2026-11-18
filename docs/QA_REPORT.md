# 动力学教材扩展（第十一章）

仅集成第11章，复核、程序检查与浏览器测试范围见 [教材整合记录](TEXTBOOK_INTEGRATION.md)。第12章尚未发布；此前计算模型的旧测试记录不作为新增教材知识的验收依据。

# v0.4.0 audit and v0.5.0-dev acceptance report

Date: 2026-11-17 (Asia/Shanghai). Baseline main: `cb46800c2c77caa4bd2715a8789bf6bb54d15ec0`. Local baseline audit fix commit: `95672c0`; published GitHub fix commit: `fbd52dde997724d7bad8047aec0c9f47ab97318e` (identical tree). Final PR head is recorded by Git and the PR, rather than embedding a self-referential SHA in this document.

## Actual baseline

Cloned the existing public repository and inspected main plus its two existing feature/fix branches and recent commits. Main is the merge of PR #2 (v0.4.0), with separate JSON, DOM-independent model scripts, UI scripts and zero-dependency Node tests. No package manager/build framework was introduced.

GitHub Actions for main `cb46800`: tests run 44114683495 **success**; Pages build/deployment run 44114682963 **success**. Hosted page visibly displayed v0.4.0 and loaded its gas model. These statuses establish deployment success, not scientific validation.

Baseline local `node --test tests/*.test.cjs`: **17 passed, 0 failed**. All original source syntax checks passed. N₂O₄ κ was already clearly labelled user-assigned with consistent units; 1 mmol L⁻¹ s⁻¹ equals 1 mol m⁻³ s⁻¹. No recurrence of the old undefined `last.dg` direction bug was observed.

## Corrections and implementation

- N₂O₄: separately stable equilibrium expressions; explicit floating-point support boundaries; rejection of derived pressure/rate overflow; stale UI results cleared after failure. Added regression tests for extreme scales, physical sample bounds and Helmholtz dissipation. An independent reviewer reproduced the original small-K cancellation and large-K overflow. The model remains phenomenological and is not experimentally calibrated.
- H₂⁺: analytical frozen-1s integrals, symmetry-based generalized eigensolve, nuclear repulsion, normalized approximate density, energy and density UI, knowledge node/relationship and model specification. Independent spatial quadrature, residual, normalization and limiting-case tests passed. The approximately 2.493 bohr minimum is explicitly a finite-basis prediction.
- Electrochemistry: reversible Nernst/Gibbs API and extension contract only; no full cell kinetics, SOC or new electrochemical UI.
- Maintenance: repository AGENTS.md, provenance, version display and documentation updated. Existing knowledge nodes largely remain draft with incomplete sources; this work does not certify the whole dataset.

## Automated checks actually executed

Environment: Node v24.22.1 locally; existing GitHub workflow uses Node 22.

```sh
node --test tests/*.test.cjs
for f in src/*.js src/models/*.js; do node --check "$f"; done
git diff --check
```

Final local result: **29 tests passed, 0 failed, 0 skipped**; source syntax and whitespace checks passed. Tests cover software validity, independently calculated mathematics, scientific consistency and existing normalized-model regressions. Browser checks below are separate from this count.

## Browser interactions actually checked

Used Chromium via the browser/computer interface and a temporary local preview. Browser DevTools is disabled by environment policy; no attempt was made to bypass it. A committed `tests/browser-harness.html` provides genuine iframe CSS viewport sizing for reproducible checks without changing browser policy.

| Check | Observed result |
|---|---|
| Existing hosted v0.4.0 | Knowledge loaded (31 nodes/13 relations); model tab displayed gas outputs |
| Development initial H₂⁺ at R=2 | S=.586453, εg=−1.053771, repulsion=.500000, Eg=−.553771, Eu=−.160854 |
| Bonding/antibonding selection | State label and density curve updated |
| R=0 | Visible error; energy values cleared |
| H₂⁺ reset | R=2 and calculated values restored |
| R=20 | Energies/density calculated; energy-plot range notice displayed |
| Gas V=0 | Visible error; previous pressure cleared to “—” |
| Gas reset | Default calculated output restored |
| Knowledge | 32 nodes/14 relations; H₂⁺ found under structure/bonding and its detail/assumptions opened by clicking its SVG circle |
| Other pages | Theory and electrochemistry pages became visible; intuition rule returned the thermodynamics/kinetics distinction |
| Console | No project-origin errors observed; browser-extension metadata errors were present and are not project errors |

| Iframe outer width | Content client/scroll width | Result |
|---:|---:|---|
| 390 px | 375 / 375 px | No page-level horizontal overflow; form controls and SVGs stayed inside the viewport |
| 768 px | 753 / 753 px | No page-level horizontal overflow; model card/chart visually inspected |
| 1280 px | 1265 / 1265 px | No page-level horizontal overflow; model card/chart visually inspected |

The 15 px difference is the vertical scrollbar. These are CSS viewport checks, not real phone/tablet hardware or Safari emulation. Small-viewport SVG text was enlarged after visual inspection. Browser acceptance is not yet automated in GitHub Actions.

## Remaining work and limits

1. Actual Android/iOS/Safari acceptance and broader accessibility checks remain open.
2. Existing knowledge metadata/provenance needs systematic expert review; no full schema migration was done. Existing browser storage recovery behavior is not comprehensively tested.
3. H₂⁺ lacks basis exponent optimization, extended basis, accurate united-atom physics, nuclear vibration and precision reference comparison; the current independent verification is within its stated approximation.
4. N₂O₄ lacks sourced K(T), kinetic calibration and nonideal gas physics. Extent reconstruction can still lose relative precision for extremely minor species; unsupported arithmetic fails explicitly.
5. Electrochemical dynamics and a quantitative electrochemical UI are intentionally deferred.
6. The production website remains on main/v0.4.0 until the maintainer authorizes merging and publication. No license was selected on the user's behalf.

## Models and tools actually used

Codex primary agent plus one separate scientific-review agent (inherited model configuration). The runtime did not return a verifiable exact underlying model ID; no claim is made that Luna, Sol or another specific model was selected. The reviewer derived equations, independently computed quadrature references, implemented the H₂⁺ tests and reviewed final science.

Tools: GitHub connector (repository/branch/commit/Actions reads and PR creation), Git CLI, Python standard library for file edits/JSON, Node native test runner and VM, public web search/open for primary lecture notes, browser/computer interface for interaction/viewport checks, and temporary local preview. No paid service, AI API, secret or private research data was added.
