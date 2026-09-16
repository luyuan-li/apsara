# Apsara

> 飞天 · Mac AI 桌宠 — transparent Live2D companion with a thin agent that can (carefully) use your desktop.

**Status:** early scaffold / design-first open source. Not a polished app yet.

## Why Apsara
Apsara (飞天) is a macOS desktop pet: a floating character you can chat with, backed by a small agent that calls confirmed tools (e.g. move a file to Trash — never silent `rm`).

## Stack (planned)
- **Shell:** Tauri 2 (transparent window, tray, filesystem bridge)
- **UI:** Vue 3 + TypeScript + Vite
- **Pet:** PixiJS + Live2D (sprite placeholder for MVP)
- **Brain:** OpenAI-compatible / Ollama function calling

## Docs
- [Architecture & directory design](docs/architecture.md)

## License
MIT — see [LICENSE](LICENSE).

Live2D sample models and Cubism SDK have their **own** licenses; do not assume MIT covers third-party model assets.
