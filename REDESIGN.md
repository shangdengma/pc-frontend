# UI 重设计说明（2026-07）

现代浅色 SaaS 风格改版。所有改动向后兼容：类名、路由、API 调用均未变更。

## 改动文件

| 文件 | 改动 |
|---|---|
| `src/styles/main.css` | **完全重写**。原文件 4040 行，由 5 层历史补丁叠加而成（token 重复定义 3 次）；现为约 1500 行单层设计体系 |
| `src/views/Login.vue` | 新增 hero 副标题与产品亮点列表、登录卡副标题；引入 `Check` 图标 |
| `src/views/QueryCreate.vue` | 改为两栏布局：左侧表单 + 右侧「本次查询」费用摘要卡（实时显示套餐与价格）和查询流程说明 |
| `src/views/Records.vue` | 工具栏新增提交时间范围筛选与「重置」；分页新增每页条数选择与总页数；加载态改为骨架屏；筛选变更自动回到第 1 页 |
| `src/views/Dashboard.vue` | 趋势图配色与新主色对齐 |
| 其余 8 个视图 | scoped 样式中硬编码的旧蓝 `#2f6fe4`/`#2864dc` 统一替换为 `var(--blue)` |

## 设计体系要点

- **色彩 token 单一来源**：主色 `--blue: #2563eb`，语义色 green/orange/red/purple 均配 soft 底色；旧变量名（`--line`、`--muted`、`--shadow-panel` 等）全部保留，scoped 样式无需改动
- **侧边栏改浅色**：白底 + 右边框，选中项为浅蓝底 + 深蓝字，替代原深藏青渐变
- **字体栈现代化**：`system-ui / PingFang SC / HarmonyOS Sans / Microsoft YaHei UI` 优先，替代排首位的 Microsoft YaHei
- **字重收敛**：800/900 全部取消，正文 400/500、强调 600、标题 700
- **统一圆角与阴影**：radius 6/10/14 三档；大投影全部替换为贴地浅阴影
- **信息密度提升**：按钮 52→38px、导航行 48→38px、表格行高约 61→46px
- **可访问性**：全局 focus-visible 焦点环、`prefers-reduced-motion` 支持保留

## 后端契约说明

查询记录的日期筛选按 RuoYi 惯例传 `params[beginTime]` / `params[endTime]`（格式 `YYYY-MM-DD HH:mm:ss`）。若后端 `/system/data/list` 未接 `params` 时间范围，需在后端补充或告知我调整传参字段。

## 未改动

- `src/views/report-full/Index.vue`（约 8000 行报告页，含独立样式与 Font Awesome 依赖，建议单独立项处理）
- `index.html` 中 Font Awesome CDN（报告页仍在使用）
