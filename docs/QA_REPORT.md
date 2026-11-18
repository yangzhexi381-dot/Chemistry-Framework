# 修复空白的“物质与组成”知识视角（2026-11-18）

原数据库虽有量子、动力学、电化学和模型节点，却没有 `chemical_entity` / `phenomenon` 节点，导致该视角始终筛出 0 个节点（用户真机截图）。新增 6 个元素节点及 9 个源自现有体系的具体化学物种，并记录元素计量、净电荷、来源、假设及限制；每个元素和物种都有有效关系，共 11 条。原有 49 个节点、38 条关系及现有模型计算代码不修改。视角筛选改为 `chemical_composition` 领域；兼容同一物种可能属于不同科学专题。新增 H₂⁺、N₂O₄、铅酸和 Hückel 体系的模型深链接。

新增 `tests/materials-view.test.cjs` 检查 15 节点、11 关系、全部节点连通、元素计量与铅酸总反应守恒；Chromium 测试模拟切换物质视角、读取化学式并点击 H₂⁺ / N₂O₄ 的模型入口，另核查移动端横向溢出。所有新增节点标记 `in_review`，部署后验收与实际手机测试区分。验收结果以 GitHub Actions 实际运行记录为准。

# “反应与机理”视角动力学图谱补全（2026-11-18）

修复此前筛选仅识别 `chemical_process` 与 `mechanism` 类型、忽略 `chemical_kinetics` 领域的缺陷。按现有节点和关系将第11章的10个知识节点、反应速率、热力学—动力学区分及铅酸电池放电案例展示在“反应与机理”；新增两条带假设、限制和来源的“定义衔接”“应用示例”关系，从而避免单独展示孤立电池节点。视角共有13个节点与14条满足全部前提节点可见的关系。

`src/graph-views.js` 将纯图谱筛选与完整前提的关系选择从 UI 分离；反应视角使用分行布局，避免手机上十多个知识点堆成一团。没有改变原有动力学教材数据、结构模型计算与知识定义。新增数据单元测试及 Chromium 交互回归。最终部署与浏览器验收以 Actions 运行记录为准。

## 结构化学七组模型融合（2026-11-18）

根据用户提供的结构化学互动 HTML，将七个原有实验拆解并融入四模块体系：独立数值内核 + 局部 DOM/Canvas 渲染 + 带前提的知识节点和跨模块链接，避免复制原 HTML 的独立导航和全局样式。数学公式与适用条件见 [结构化学整合记录](STRUCTURE_CHEMISTRY_INTEGRATION.md)。科学节点仍为 `in_review`；部署与浏览器验收结果以本次 GitHub Actions 为准。

# 页面布局合并与验收（2026-11-18）

本次仅做 HTML 页面结构、导航路由与 CSS 改动：五个顶层导航合并为四个，电化学电池体系成为工作台页面内的子模块，旧 `#electrochem` 仍可定位；原电化学 8—10 节静态理论块原样移动到“理论工具”的统一理论板块，与已有第11章动力学深入理论共置。计算模块、数据 JSON、公式与解释文本均未修改。

同步更新静态 DOM 结构测试与 Chromium 浏览器验收，覆盖四按钮、两个集成模块、三个电化学章节面板、动态动力学、旧链接、电池状态切换、不同视口。实际测试/部署结果以本次 GitHub Actions 对应 SHA 为准。真实 Android/iOS 硬件验收仍未开展。

**Chromium 交互回归修复：**原电化学节点的 `equations` / `assumptions` / `limitations` 字段为字符串，而较新的知识节点使用数组。首次跨模块点击暴露了 `.join` / `.map` 类型不兼容；本轮在图谱显示层统一解析两种已有格式，保留原始来源数据，并由跨模块浏览器测试实际验证。不得将静态数据检查视为视觉验收。

# 统一知识网络跨模块整合（2026-11-18）

以 `5c524e5a4dda119afb57d2468acab5982c64b5ba` 为基线，`data/knowledge.json` 新增 `module_paths` 作为五个模块共享知识关系，概念以 `#concept/<id>` 统一跳转；问题判断与模型提供直接关系图链接，旧 `#learn/pc.11.x` 保留。可见界面移除独立教材类标签，来源、页码和审核状态仍保留。未修改科学计算模型，动力学数据仅修改总览摘要和领域显示名。

新增 `tests/module-knowledge.test.cjs`，检查路径与关系引用、来源及链接。Chromium 测试新增五模块交互和问题判断链接，最终结果以 GitHub Actions CI 与 Pages 发布后的线上工作流为准。真实 Android/iOS 硬件验收另行进行。

# 浏览器验收自动化（2026-11-18）

新增 `.github/workflows/browser-acceptance.yml`：PR 环境用临时 HTTP 服务运行 Chromium/Playwright；当 GitHub Pages 发布工作流成功结束时，以相应部署版本 SHA 检出源码，并对线上 Pages 地址进行相同的交互测试。检查包括第11章原有固定链接、理论工具页加载与旧路由、知识图谱至教材点击、搜索、自测、浏览器后退/前进、三种 CSS 宽度、模型路由和 503 恢复。测试脚本使用 Playwright 管理的 Chromium，不代表真实 Android 或 iOS 设备验收。实际通过记录以 GitHub Actions 本次运行结果为准；未运行时不得标为成功。

# 理论工具内嵌教材知识（2026-11-18）

本次仅调整信息架构：将原独立 `#learn` 页面嵌入 `#theory`，移除第06个顶层导航按钮。保留 `#learn/pc.11.x` 深链接和 `#learn` 旧入口，并让普通 `#theory` 导航首次打开时加载章节内容。第十一章的 JSON 数据、知识关系图、独立科学计算均未修改。

新增 `tests/theory-curriculum.test.cjs`，检查唯一页面入口、嵌套结构、旧链接路由和模型入口保留。`tests/curriculum-browser.cjs` 补充主选项卡、内嵌页和普通理论页访问的可选浏览器验收。实际 CI 与 GitHub Pages 部署应以本次 PR 工作流状态为准；未运行的手机端交互和响应式浏览器检查不可声称通过。

# 第十一章知识关系图扩展（2026-11-18）

本次以主分支 `898d4eb8b21bd5c66dca8df7472c34223d69ff69` 为基线，新增十个教材关联图谱节点及十四条带前提的关系，新增章节专属视角和节点到教材的固定链接。关联式的类型区分教学依赖、受限推导、经验关系和机理约束，避免混同。图谱节点摘要基于已发布的 `pc-11.json`；相关来源与页码留在节点数据中。

新增 `tests/kinetics-graph.test.cjs`，检查 11.1—11.10 完整覆盖、教材引用、公式镜像一致性、关系端点、唯一标识及链接安全。原有模型无改动。

实际 GitHub CI 检查及 Pages 部署需以本次 PR 的工作流结果为准；本次未完成真实设备/浏览器交互验收，不能将 Node 测试作为视觉和科学内容的全面验证。已有知识节点仍处于相应的审核状态。

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
