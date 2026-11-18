# Chemistry Framework (CF)

**Chemistry-first · Evidence-aware · Interactive Models**

以化学问题为入口的知识网络与科学模型可视化项目。本仓库将原有 **Chemistry Framework v0.3.1 Mobile** 单文件 HTML 拆分成可维护的网页、知识数据和模型代码。当前为**可运行的静态网站 MVP**，并非已完成全部学科内容或真实体系求解器。

## 在线预览

在线演示：[Chemistry Framework](https://yangzhexi381-dot.github.io/Chemistry-Framework/)（GitHub Pages）。

## 当前开发版：v0.5.0-dev

在已部署的 v0.4.0 基线上修复 N₂O₄ 数值边界，并新增可计算的 H₂⁺ 最小 1s LCAO 模型：解析积分、Hc=εSc、核排斥、势能曲线和近似电子密度截面。独立空间求积复核矩阵元。详见 [H₂⁺ 模型说明](docs/models/H2PLUS_LCAO.md)。该计算模型已通过PR #3合入main，当前仍标记开发版。

## v0.4.0 计算模型增强

新增 N₂O₄ 理想气体（定温、定容）定量计算：输入 T、V、初始物质的量、K°(T)、现象学速率尺度 κ 和时间，计算分压、反应商、反应 Gibbs 能、组分时间曲线及解析平衡组成，附 SI 单位、算法边界和独立回归测试。与旧版归一化演示并存。

数学推导、假设和参考来源见 [N₂O₄ 模型规范](docs/models/N2O4_IDEAL_GAS.md)。K° 与 κ 为用户提供的模型参数，**不代表从实验文献获得的 N₂O₄ 速率常数**。

## 项目内容

- **探索化学**：知识节点、关系和假设边界。
- **验证我的直觉**：对化学猜想进行结构化审查；当前版本未连接外部文献检索或 AI API。
- **理论工具**：量子、统计、热力学与反应动力学的定义、推导、近似和适用边界，链接到统一知识网络。
- **电化学贯通**：电池工作原理与不同状态的概念性展示。
- **真实模型工作台**：H₂⁺ 相位示意与最小基组定量计算、N₂O₄ ⇌ 2NO₂ 动力学/平衡教学模型、铅酸电池反应进度教学模型。

> **科学说明**：模型不等于真实实验测量。每项模型应明确方程、假设、参数、单位、适用范围、数值方法和验证标准；其中概念示意不能被当成定量预测。当前部分数据仍处于 `draft` 审核状态。详见 [科学内容维护规范](docs/SCIENCE_POLICY.md)。

## 目录

```text
chemistry-framework/
├── index.html                 # 浏览器入口
├── assets/css/style.css       # 页面样式
├── data/knowledge.json        # 节点/关系/案例/证据数据
├── src/
│   ├── app.js                 # 知识网络、交互逻辑
│   ├── workbench.js           # 模型工作台交互与绘图
│   └── models/
│       ├── h2plus.js          # H₂⁺ 解析 LCAO 科学模型
│       ├── n2o4.js            # 反应动力学教学模型
│       └── lead-acid.js       # 铅酸电池教学模型
├── docs/
│   ├── SCIENCE_POLICY.md
│   └── theory/CORE_THEORY.md
├── tests/smoke.test.cjs       # 零依赖静态与模型检查
└── README.md
```

## 本地运行（电脑）

本项目不需要 `npm install`。由于知识数据由 `fetch()` 载入，请**使用本地 HTTP 服务**，不要直接双击 `index.html` 并以 `file://` 方式打开。

安装了 Python 时，在解压后的项目根目录运行：

```bash
python -m http.server 8000
```

然后在浏览器打开 `http://localhost:8000/`。

安装了 Node.js 时可运行静态与模型测试：

```bash
node --test tests/*.test.cjs
```

## 维护与贡献

本仓库已建立；日常开发从最新 main 创建功能分支，先测试再提 PR，合并与重大版本发布须获得维护者授权。请勿重新初始化仓库或将密钥放入前端。

## 初次部署说明（已有仓库无需重复）

**零命令行方式：**

1. 在 [GitHub 创建仓库](https://github.com/new)，建议名称 `chemistry-framework`，选 Public（需公开发布时）。
2. 将本压缩包**解压后**的全部文件和文件夹上传到仓库根目录，提交变更（Commit changes）。不要只上传 ZIP 文件。
3. 打开仓库 **Settings → Pages → Build and deployment → Source: Deploy from a branch**。
4. 选择 `main`、`/(root)` 并保存。
5. 发布后访问 `https://yangzhexi381-dot.github.io/Chemistry-Framework/`。

注意：GitHub Pages 不能运行服务器端 Python、数据库或私有模型 API；以后若接入 AI 文献检索，需要独立后端，且不能把 API Key 放进 `index.html`、JS、公开仓库或客户端可访问的配置。

**命令行方式（已有空仓库时）：**

```bash
git init
git add .
git commit -m "Initial public MVP of Chemistry Framework"
git branch -M main
git remote add origin https://github.com/<你的用户名>/chemistry-framework.git
git push -u origin main
```

## 版本策略

- **v0.3.1**：来源于此前单文件移动端演示。
- **v0.3.1-github-starter**：只做文件组织和工程化发布，不声称增加新的科学模型或验证结果。
- **v0.3.2**：修复 N₂O₄ 反应方向显示的属性名错误，补充模型回归测试；未修改科学计算假设。
- **v0.4.0（当前已部署基线）**：新增理想气体 N₂O₄ 单位一致计算模型、独立解析平衡验算、回归测试及文档；保留既有演示。
- 后续建议：逐个模型添加可复现实验/参考算例、自动化测试；知识节点添加证据来源与审校状态；再考虑引入打包工具和前端框架。

## 许可与引用

**暂未选定开源许可证。** 公开仓库不等于自动授权第三方再分发或修改。准备真正开源前，应明确代码许可证（如 MIT）、文档/内容许可证（如 CC BY 4.0），并核对教材、图像、论文以及引用素材的版权。若没有相应权利，不要直接上传原文扫描件和受版权保护素材。

公开版只保留通用理论说明和教学模型；内部理论主文档与个人科研案例没有收入此发行包。公开教学内容尚未经过独立同行评审；具体结论应核对文献和模型检验。

## 开发验收记录

当前开发版的实际测试、浏览器检查与未解决问题见 [QA_REPORT](docs/QA_REPORT.md)。
响应式布局可在本地 HTTP 服务中打开 `tests/browser-harness.html`，选择 390/768/1280 px 检查；这不替代真实设备测试。
电化学扩展接口见 [技术预留说明](docs/models/ELECTROCHEMICAL_INTERFACE.md)。

## 跨模块知识网络

探索化学、验证我的直觉、理论工具、电化学贯通、真实模型工作台共享 `data/knowledge.json` 中的知识节点、带条件的关系与 `module_paths` 路径。各模块自动构造概念入口，点击概念使用 `#concept/<id>` 打开统一关系图，继续核对解释、假设、适用范围与证据状态。

反应动力学十个深入知识单元留在理论工具内，保留公式、推导、适用条件与自测。旧的 `#learn/pc.11.x` 链接继续有效，但不再按“教材”设置独立功能。原出版物的来源、页码及审核标记仍可查证。数值科学计算模型未修改。

执行 `node --test tests/*.test.cjs` 完成数据一致性检查；Chromium 交互与正式 GitHub Pages 验收由 Browser acceptance 工作流执行。
