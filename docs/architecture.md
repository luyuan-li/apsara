# Apsara — Mac AI 桌宠：架构与目录设计

> 目标平台：macOS Apple Silicon  
> 产品形态：透明置顶 Live2D/动画角色 + 对话 Agent + 可扩展桌面工具  
> 原则：壳要薄、脑要稳、危险操作必须确认

---

## 1. 产品边界（先定死，避免做成小操作系统）

### MVP（第 1 期）
- 透明无边框窗口，角色浮在桌面，可拖拽、滚轮缩放
- 系统托盘：显示/隐藏、锁定点击穿透、退出
- 聊天气泡 + 输入框（先文字，后语音）
- Agent：接 OpenAI 兼容 API 或本地 Ollama
- 工具 3 个：`trash_path`（丢废纸篓）、`open_path`、`reveal_in_finder`
- 危险工具：二次确认弹窗；默认只允许用户目录白名单

### 明确不做（第 1 期）
- 完整 IDE / 浏览器自动化大而全
- 多宠物联机
- 商业级 Live2D 制作管线（先用样例模型或序列帧占位）

### 第 2 期
- 古风 Live2D 模型热切换、表情/动作由模型驱动
- TTS + 口型、ASR 语音指令
- 插件系统（外部进程注册工具）
- 记忆（短期会话 + 长期偏好）

---

## 2. 推荐技术选型

| 层 | 选型 | 理由 |
|----|------|------|
| 桌面壳 | **Tauri 2** | 包体小、易调 macOS 透明/置顶；也可用 Electron 换速度 |
| 前端 UI | Vue 3 + TypeScript + Vite | 桌宠 UI 简单，生态熟 |
| 角色渲染 | PixiJS + `pixi-live2d-display`（Live2D Cubism 4） | 业界常见；MVP 可先用 Spine/序列帧适配器 |
| Agent | 自研薄封装（OpenAI-compatible function calling） | 少依赖，工具协议自己控 |
| 本地模型（可选） | Ollama | 无 Key 也能聊 |
| 废纸篓 | macOS `trash` CLI / AppleScript `move to trash` | 可恢复，禁止直接 `rm` |
| 配置/记忆 | 本地 JSON / SQLite（sqlx 或前端侧） | 先 JSON，不够再 SQLite |

备选：若你更熟 Electron，把 `apps/desktop` 换成 Electron 即可，**目录与 Agent 协议保持不变**。

---

## 3. 总体架构

```
┌─────────────────────────────────────────────────────────┐
│                     macOS Desktop                        │
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Pet Window   │  │ Chat/Confirm│  │ System Tray     │ │
│  │ (transparent)│  │  windows    │  │                 │ │
│  └──────┬───────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                 │                   │          │
│         └────────────┬────┴───────────────────┘          │
│                      ▼                                   │
│              Tauri Shell (Rust)                          │
│         window · tray · FS bridge · trash                │
└──────────────────────┬──────────────────────────────────┘
                       │ IPC (commands / events)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 Frontend (Vue)                           │
│  Renderer · Chat UI · ToolConfirm · Settings             │
│                      │                                   │
│                      ▼                                   │
│              Agent Runtime (TS)                          │
│   LLM Client ↔ Tool Registry ↔ Memory ↔ Persona          │
└─────────────────────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   Cloud/Local LLM   Tools        Assets
   (API/Ollama)   trash/open/…   Live2D/img
```

### 数据流（一次用户指令）
1. UI 收到「把桌面上的草稿.txt丢进废纸篓」
2. Agent 组 prompt（人设 + 工具 schema + 短记忆）→ 调 LLM
3. LLM 返回 `trash_path({ path })`
4. 前端弹出确认：「确认移到废纸篓？」
5. 用户点确认 → Tauri command `trash_path` → 系统废纸篓
6. 工具结果回灌 LLM → 气泡回复「好了，已丢进废纸篓」

---

## 4. 分层职责

### A. Shell（Rust / Tauri）
- 窗口：transparent、alwaysOnTop、可选 click-through
- 托盘与全局快捷键
- **唯一**允许碰文件系统/进程的地方
- 暴露有限 commands：`trash_path`、`open_path`、`reveal_in_finder`、`pick_file`、`get_config`、`set_config`
- 路径校验：规范化、禁 `..` 逃逸、默认白名单 `~/Desktop` `~/Downloads` `~/Documents`

### B. Renderer（Vue）
- Live2D/动画画布、拖拽命中区
- 聊天气泡、输入、设置
- 工具确认模态（所有 destructive 工具必经）

### C. Agent（TypeScript，跑在前端或轻量 sidecar）
- `LlmClient`：流式 SSE、OpenAI / Ollama 兼容
- `ToolRegistry`：名称、JSON Schema、handler、`risk: safe|confirm|forbidden`
- `Persona`：古风人设文案与语气
- `Memory`：当前会话；第 2 期再加长期记忆

### D. Assets
- Live2D 模型目录、占位图、托盘图标
- 模型与代码分离，方便换古风皮

---

## 5. 目录结构（建议 monorepo）

```
desktop-pet/
├── README.md
├── package.json                 # pnpm workspace root
├── pnpm-workspace.yaml
├── .env.example                 # API_BASE_URL / API_KEY / MODEL（勿提交真实 Key）
├── docs/
│   ├── architecture.md          # 本文
│   ├── tool-protocol.md         # 工具 JSON Schema 约定
│   └── mac-permissions.md       # 废纸篓/自动化权限说明
│
├── apps/
│   └── desktop/                 # Tauri 应用
│       ├── package.json
│       ├── index.html
│       ├── vite.config.ts
│       ├── src-tauri/
│       │   ├── Cargo.toml
│       │   ├── tauri.conf.json
│       │   ├── capabilities/    # Tauri 2 权限清单（最小授权）
│       │   └── src/
│       │       ├── main.rs
│       │       ├── lib.rs
│       │       ├── window.rs      # 透明/置顶/穿透
│       │       ├── tray.rs
│       │       ├── fs_tools.rs    # trash/open/reveal + 白名单
│       │       └── config.rs
│       └── src/                   # Vue 前端
│           ├── main.ts
│           ├── App.vue
│           ├── styles/
│           ├── components/
│           │   ├── PetStage.vue       # 角色画布
│           │   ├── ChatBubble.vue
│           │   ├── ChatInput.vue
│           │   ├── ConfirmDialog.vue
│           │   └── SettingsPanel.vue
│           ├── composables/
│           │   ├── usePetWindow.ts
│           │   ├── useChat.ts
│           │   └── useTools.ts
│           ├── agent/
│           │   ├── index.ts
│           │   ├── llmClient.ts
│           │   ├── prompts.ts
│           │   ├── memory.ts
│           │   ├── persona.ts
│           │   └── tools/
│           │       ├── registry.ts
│           │       ├── trashPath.ts
│           │       ├── openPath.ts
│           │       └── revealInFinder.ts
│           ├── renderer/
│           │   ├── createStage.ts     # Pixi 应用
│           │   ├── live2dPet.ts       # Live2D 适配
│           │   └── spritePet.ts       # MVP 序列帧占位
│           ├── stores/
│           │   ├── settings.ts
│           │   └── session.ts
│           └── types/
│               ├── tools.ts
│               └── messages.ts
│
├── packages/
│   ├── shared/                  # 前后端共享类型（可选）
│   │   ├── package.json
│   │   └── src/
│   │       ├── tool-schema.ts
│   │       └── ipc.ts
│   └── mock-llm/                # 本地假 LLM，无 Key 也能联调工具流
│       ├── package.json
│       └── src/index.ts
│
├── assets/
│   ├── tray/
│   │   └── icon.png
│   ├── pets/
│   │   ├── placeholder/         # 序列帧或静态图 MVP
│   │   └── live2d/
│   │       └── sample-mao/      # 官方样例（注意授权）
│   └── personas/
│       └── guofeng-default.md
│
└── scripts/
    ├── dev.sh
    └── check-trash.sh           # 检测 macOS trash 可用性
```

---

## 6. 关键协议（建议先写死）

```ts
type ToolRisk = "safe" | "confirm" | "forbidden";

interface ToolDef {
  name: string;
  description: string;
  risk: ToolRisk;
  parameters: JsonSchema;
  // risk=confirm 时：先 UI 确认，再调 Tauri
}
```

内置工具示例：

| name | risk | 行为 |
|------|------|------|
| `trash_path` | confirm | 移到废纸篓（可恢复） |
| `open_path` | confirm | `open` 打开文件/App |
| `reveal_in_finder` | safe | Finder 中显示 |
| `list_desktop` | safe | 列桌面文件名（只读） |

禁止在 MVP 暴露：任意 shell、`rm -rf`、键盘鼠标全局注入。

---

## 7. macOS 注意点（提前写进设计）

- **点击穿透**：鼠标在角色像素外穿透，命中角色才拖拽；「锁定」模式关闭穿透以便点 UI
- **废纸篓**：优先系统 `trash`；失败再 AppleScript；永远不要默认 `rm`
- **Gatekeeper / 公证**：以后分发再做；开发期 `tauri dev` 即可
- **Live2D 授权**：Cubism SDK / 模型各有条款；商用前单独查
- **权限**：若做 UI 自动化再要辅助功能权限；MVP 文件系统工具通常不需要

---

## 8. 实施顺序（按周理解即可）

1. **空壳**：Tauri 透明窗 + 托盘 + 一张占位图可拖  
2. **Chat UI**：本地 mock LLM 回声对话  
3. **Tools**：接通 `trash_path` + 确认框（用测试文件验证）  
4. **真 LLM**：`.env` 接 API 或 Ollama  
5. **Live2D**：换上样例模型；人设换成古风  
6. **打磨**：动画、记忆、设置页、打包 `.dmg`

---

## 9. 你接下来可以怎么用这份设计

- 按 `apps/desktop` 脚手架初始化 Tauri + Vue  
- 先实现 `spritePet` 占位，不堵在 Live2D 上  
- 工具协议与目录一旦定下，Agent 与壳可以并行开干  

若要下一步，我可以把这份文件落到你 Mac 的指定目录，或按此目录直接生成空项目骨架（仍不装 NyaDeskPet）。

---

## 10. 运行时与模块边界（补充）

### 进程
- 单进程 Tauri：WebView（Vue）+ Rust 壳
- Agent 跑在 WebView（TS）；所有 FS 经 `invoke`

### 状态
- `session`：消息列表、pending tool confirmation
- `settings`：模型端点、穿透开关、缩放、白名单（MVP 可只读默认）

### 事件
- `tool:confirm-required` → UI
- `tool:confirmed` / `tool:cancelled` → Agent 继续

详见 `product-mvp.md`、`ux-flows.md`、`security.md`。
