# @guojing6/dsh-webchat

DeepSeek Harness **Desktop** 客户端插件：把 **9 个内置网页版 AI 对话站点**和**你自己的站点**收进 DSH 的**右侧栏**，一个标签页里随时切换、排序，和对话并排使用。

内置站点为 DeepSeek、通义千问、豆包、Kimi、智谱清言、ChatGPT、Gemini、Grok、Z.ai，默认全部显示；点工具栏的**齿轮 → 选择网站**即可自由启用、关闭或排序。

**只在 DSH Desktop 生效；Web 端不注册任何 UI。** 这是对原 `@guojing6/dsh-deepseek-chat`（3.x，只支持 DeepSeek Chat）的多站点重写，包名、标签类型和存储键都已更换。

## 功能

| 入口 | 结果 |
| --- | --- |
| 右侧栏 guide 卡片 **网页版 AI**（工作区文件 / Forge 评审 / 新建终端 / 浏览器之后、会话数据诊断之前） | 在右侧栏打开（或聚焦）网页版 AI 标签页 |
| 会话头部工具区最左侧的聊天图标按钮 | 同上 |
| **Ctrl+Q**（Windows；macOS 为 ⌘⌥Q；Desktop Linux 默认不绑定） | 同上；没有打开会话时命令被阻止并在快捷键列表里说明原因 |

打开后，标签页顶部是已启用的站点图标：

- **齿轮 / 选择网站**：勾选要显示的站点，立即生效并记住选择；用 ↑ / ↓ 调整顺序。
- **添加自定义站点**：在面板底部填名称和网址，即可把任意网页版 AI 加入同一套切换、排序和登录态镜像流程。
- **重新加载**：重新加载当前站点。
- **在浏览器中打开**：用系统浏览器打开当前站点。
- 回答里的网页链接交给 DSH——固定进右侧栏的 Browser 标签，不占用网页版 AI 标签页。

切换站点不会丢掉别的站点：每个访问过且仍启用的站点各自保留一个内嵌 `webview`，切回来页面状态还在；关闭某个站点会卸载它的 `webview`，释放内存，重新启用后从登录态快照恢复。

关闭当前正在使用的站点时，会自动切到下一个仍启用的站点；全部关闭时显示“还没有启用网站”的空状态，点“选择网站”重新启用。自定义站点可以随时删除：点行尾的垃圾桶图标，再点“删除”确认；删除后当前站点会自动回退。

右侧栏标签标题跟随当前站点（例如 `DeepSeek`、`通义千问`），没有选中站点时显示 `网页版 AI`。界面文字跟随 DSH 的语言（中文 / English）。

### 站点

| 站点 | 地址 | 默认显示 | 说明 |
| --- | --- | --- | --- |
| DeepSeek | `https://chat.deepseek.com/` | ✅ | 默认站点 |
| 通义千问 | `https://www.qianwen.com/` | ✅ | |
| 豆包 | `https://www.doubao.com/chat/` | ✅ | |
| Kimi | `https://www.kimi.com/` | ✅ | 未登录时可能先看到官网首页，登录后进入对话 |
| 智谱清言 | `https://chatglm.cn/` | ✅ | |
| ChatGPT | `https://chatgpt.com/` | ✅ | 需要能访问该站点的网络 |
| Gemini | `https://gemini.google.com/app` | ✅ | 需要能访问该站点的网络 |
| Grok | `https://grok.com/` | ✅ | |
| Z.ai | `https://chat.z.ai/` | ✅ | 智谱国际版，GLM 系列 |

内置站点只保留这 9 个；其他网页版 AI 可以用“添加自定义站点”加入，页面能否打开取决于网络与站点策略。

## 兼容性

- 按 DSH **0.2.2-rc.5** 复核；`engines.dsh` 声明为 `>=0.2.1-alpha.3 <0.2.3-0`。
- 插件 manifest 的 `dsh.client.platform` 只能是 `"web"`（Desktop 与 Web 共用同一份前端 bundle），所以“仅 Desktop”是在运行时用 `dsh-app://` / `data-platform` 判定的，不是 manifest 字段。
- 依赖的宿主契约：`ctx.sidebarRightTabs.register`、`ctx.sidebarRight.openTab` / `commandTarget`、`sidebar.right.pane.tab` 与 `.title` 两个按 id 分发的槽位、`conversation.session.header.utilities`、`ctx.shortcuts.register`、`ctx.locale.register/bind`、`window.dshDesktop.browser`（`acquire` / `release` / `onOpenRequested`）。

## 安装

### 方式一：DSH Desktop 插件页

1. 打开 **插件** 页（或设置里的插件管理）。
2. 选择 **添加插件**，指向本目录（包含 `package.json`、`lib/client.js`、`cordis.patch.yml` 的目录）。
3. 安装后插件默认启用；如果宿主提示需要重启，重启 Desktop。

### 方式二：命令行（开发 / 离线）

```bash
# 先启动一次 Desktop 初始化 profile，再完全退出 Desktop
dsh plugin --profile desktop add E:/workspace/dsh-webchat/.agents/worktrees/dsh-f4fb054f-c67b
```

`dsh plugin` 会把参数转发给 profile 目录里的 pnpm；本地目录会记成 `link:`，改完代码后重新构建/重启即可。卸载：

```bash
dsh plugin --profile desktop remove @guojing6/dsh-webchat
```

发布到 npm 后也可以直接 `dsh plugin --profile desktop add @guojing6/dsh-webchat`。

### 从旧插件迁移

旧包 `@guojing6/dsh-deepseek-chat` 与本插件互不依赖，可以并存，但不建议同时启用两个右侧栏标签。迁移步骤：

1. 卸载或停用旧包：`dsh plugin --profile desktop remove @guojing6/dsh-deepseek-chat`。
2. 安装本插件。
3. 在 **DeepSeek** 站点里重新登录一次。旧包的登录快照键是 `dsh-deepseek-chat:chat-session`，本插件用的是 `dsh-webchat:session:<provider>`，不会读取旧快照。

## 实现

- **纯客户端插件**：`lib/index.js` 只有空的服务端 `apply()`；`lib/client.js` 是单个 `window.__ModuleLoader__.load({ id, factory })`，只 `require("react")`，不依赖其他运行时模块。
- **一个标签类型，九个内置站点 + 自定义站点**：标签类型 `webchat`。工具栏只渲染启用的站点；每个访问过的启用站点各有一个内嵌 `webview`，未访问或已关闭的站点不创建。全部站点共用一个 DSH 浏览器工作区租约（`acquire("dsh-webchat")`），每个 `webview` 有自己的 lease。
- **启用/关闭与排序**：启用结果存进宿主 `dsh-app://app` 的 `localStorage`，键 `dsh-webchat:enabled-providers`（JSON 数组）；顺序存在 `dsh-webchat:provider-order`。默认值是这 9 个站点；关闭当前站点会切到下一个启用站点；全部关闭时进入空状态。关闭站点会卸载对应 `webview`。
- **自定义站点**：名称 + http(s) 网址存进 `dsh-webchat:custom-providers`（JSON 数组，最多 40 个），沿用内置站点的 `webview`、启用/关闭、排序、重载、外开和按 id 隔离的登录态镜像；删除自定义站点会同时从启用集合和顺序里移除，删除前需在设置面板里二次确认。
- **登录态镜像**：DSH 的右侧栏浏览器分区是内存分区，Desktop 重启后丢失。插件在站点加载完成、停止加载、每 60 秒以及销毁时，读取该站点的 `localStorage` 与 `document.cookie`，按站点写入宿主 `dsh-app://app` 的 `localStorage`（键 `dsh-webchat:session:<provider>`，版本 2）。下次打开先加载该站点的 `robots.txt` 作为引导页，写入快照后再进入应用页。
- **UA**：内嵌 `webview` 的 UA 由插件重建为标准 Chromium UA，去掉 Electron / 产品标记，避免站点把内置浏览器当成不支持的客户端。
- **链接**：`onOpenRequested` 只接受 `http/https`，交给右侧栏 Browser 标签；没有 Browser 标签时退回系统浏览器。
- **样式**：全部走 DSH 主题 token（`--dsw-alias-*`、`--dsw-specific-sidebar-fill`），不写死颜色；站点图标分别为内联 SVG 或 PNG data URI，不额外请求网络。

## 已知问题与限制

- **只在 Desktop 生效**：Web 端不会注册标签、卡片、按钮或快捷键。
- **由 DSH 壳的 guest 策略决定**：内嵌 `webview` 不授予摄像头、麦克风、地理位置、通知、下载等权限；站点要求这些能力时会失败或降级。插件不能绕过壳的权限策略。
- **登录态不是永久可靠**：镜像依赖 `document.cookie` 与 `localStorage` 可读；站点改用 HttpOnly cookie、IndexedDB 或更严格的存储策略时，重启后可能需要重新登录。快照按站点隔离，但保存在宿主页面存储中，能读 DSH 客户端存储的代码都能读到，不要在这台机器上保存高敏感账号。
- **ChatGPT / Gemini 的可达性**：这两个站点在部分网络环境不可达；插件不做代理，失败时显示错误卡片，并提示开启系统代理 / TUN 后重试。
- **站点侧验证**：部分站点可能先显示登录页或人机验证页；这是站点侧策略，验证通过后可以正常使用。
- **页面结构会变**：插件不注入站点脚本、不解析对话内容，只负责嵌入与登录态镜像；站点改版不影响基本打开，但官网落地页/登录跳转可能变化。
- **内存**：每个访问过且启用的站点都保留一个 `webview`；9 个内置站点外加自定义站点都启用并访问会明显增加内存。关闭站点会卸载并释放。
- **快捷键冲突**：`Ctrl+Q` 是 Desktop 默认；如果与其他插件冲突，可在 DSH 快捷键设置里改。
- **标签类型固定为一个**：不支持同时开两个“网页版 AI”标签；需要并排对比时用站点切换，或在浏览器里另开。

## 开发与检查

```bash
npm run check   # node --check lib/client.js && node --check lib/index.js
npm test        # node --test，33 个用例
```

测试覆盖：manifest / patch / 服务端入口一致性、懒加载工厂、9 个内置站点目录、locale 键对齐、Web 端惰性、注册与清理、头部按钮、快捷键阻止/执行、标签标题跟随站点、默认 9 个站点按钮与懒挂载、启用集合持久化/过滤/空状态/当前站点回退、自定义站点校验/持久化/排序/删除、登录态读写与上限、快照往返/过期/空快照、guest 租约/UA/引导页/错误路径、弹窗路由、销毁时抓取与释放、轮询抓取。

## 版本历史

- **4.4.0**：自定义站点删除改为垃圾桶图标 + 行内二次确认；删除后自动切到下一个启用站点；修复启用集合为空时误恢复默认站点的问题；测试增至 33 项。
- **4.3.0**：新增自定义站点（名称 + 网址）和站点排序，入口图标从彩色方块改为聊天图标；测试增至 31 项。
- **4.2.0**：新增 Z.ai（智谱国际版，默认显示），站点总数 20，默认显示前 9 个；测试增至 28 项。
- **4.1.0**：站点从 8 个扩展到 19 个（新增文心一言、讯飞星火、天工、商汤商量、360 智脑、Claude、Perplexity、Grok、Mistral、Poe、HuggingChat，默认隐藏）；新增“选择网站”启用/关闭功能，选择持久化，关闭站点即卸载 `webview`，全部关闭时显示空状态。
- **4.0.0**：由单站点 DeepSeek Chat 插件重写为八站点网页版 AI 插件；新增站点切换、每站点登录态镜像、站点标题、重载/外开动作、中英文案；入口改为 guide 卡片 + 会话头部按钮 + Ctrl+Q，去掉旧的 hero 角落按钮。
- **3.x**（旧包 `@guojing6/dsh-deepseek-chat`）：单站点 DeepSeek Chat，右侧栏标签 + 会话头部按钮 + Ctrl+Q。

## License

MIT
