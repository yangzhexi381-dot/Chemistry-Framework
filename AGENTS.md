# Chemistry Framework engineering rules

Read the current checkout and Git history before modifying. Work from latest main on a feature branch. Never merge main or publish a major version without explicit maintainer authorization. Do not overwrite unrelated work.

Keep JSON knowledge/evidence, DOM-independent models and UI controllers separate. Use stable model and concept IDs. Do not duplicate scientific equations in controllers. Supply units, assumptions, approximation boundaries, provenance and review status. Illustrations, calculations and measurements must be labelled distinctly. Never invent experimental rates, data or citations.

For a new scientific model provide an independent reference or independently computed numerical benchmark, limiting cases, invalid-input checks and a corresponding interface. Test software function, numerical mathematics and scientific consistency separately; document browser interactions and viewport checks. Passing tests is not evidence of physical completeness.

Required checks:

```sh
node --test tests/*.test.cjs
for f in src/*.js src/models/*.js; do node --check "$f"; done
git diff --check
```

Use `tests/browser-harness.html` via HTTP for CSS viewport acceptance at 390, 768 and 1280 px. Verify normal calculation, invalid inputs, recovery, state selection and tab navigation. Record actual results and limitations in docs/QA_REPORT.md. CI currently runs Node checks; browser acceptance remains a separate recorded task.

Before PR update README, CHANGELOG and scientific model documents. Report baseline/head SHA, changes, actual tests, remaining gaps, branch and PR URL. Do not expose secrets or internal research material. If delegating scientific review, state which parts were independently checked and report only confirmed model/tool identities.
