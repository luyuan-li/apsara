# Apsara

> 飞天 · Mac AI 桌宠 — a transparent Live2D (or sprite) companion with a thin agent that can carefully use your desktop.

**Status:** early open-source scaffold (architecture + empty modules). Not a runnable pet yet.

## Current status
Design docs are in `docs/` (`product-mvp`, `ux-flows`, `security`, architecture, tools).  
App modules are scaffolded; wiring Vite + `tauri dev` is the next implementation milestone.

## Why Apsara
Apsara (飞天) aims to be a macOS desktop pet you can chat with. The agent may call tools such as moving a file to **Trash** — always with confirmation, never silent `rm`.

## Stack (planned)
| Layer | Choice |
|-------|--------|
| Shell | Tauri 2 (transparent window, tray, FS bridge) |
| UI | Vue 3 + TypeScript + Vite |
| Pet | PixiJS + Live2D; MVP sprite placeholder |
| Brain | OpenAI-compatible / Ollama function calling |

## Repo layout
```
apps/desktop/     Tauri + Vue app
packages/shared/  Tool schemas & IPC types
packages/mock-llm Local echo LLM for UI wiring
assets/           Personas, placeholder art, Live2D later
docs/             Architecture & protocols
```

## Docs
- [Architecture & directory design](docs/architecture.md)（中文）
- [Tool protocol](docs/tool-protocol.md)
- [MVP product & acceptance](docs/product-mvp.md)
- [UX flows](docs/ux-flows.md)
- [Security model](docs/security.md)
- [macOS notes](docs/mac-permissions.md)

## Development (soon)
```bash
pnpm install
pnpm dev:desktop   # after Vite + tauri are wired
```

Copy `.env.example` → `.env` and fill API settings when you connect a real model.

## License
MIT — see [LICENSE](LICENSE).

**Live2D Cubism SDK and third-party models are NOT covered by MIT.** Respect their licenses separately.
