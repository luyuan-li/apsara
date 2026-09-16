# Tool protocol (MVP)

Tools are registered in the Agent `ToolRegistry` with JSON Schema parameters and a risk level.

| Risk | Behavior |
|------|----------|
| `safe` | Run immediately via Tauri command |
| `confirm` | UI confirmation required, then Tauri |
| `forbidden` | Never exposed to the model |

## Built-in tools

| Name | Risk | Description |
|------|------|-------------|
| `list_desktop` | safe | List names on `~/Desktop` (read-only) |
| `reveal_in_finder` | safe | Reveal a path in Finder |
| `open_path` | confirm | Open file/folder/app with macOS `open` |
| `trash_path` | confirm | Move path to Trash (recoverable). Never `rm`. |

## Path rules
- Normalize and reject `..` escapes
- Default allowlist: `~/Desktop`, `~/Downloads`, `~/Documents`
- Shell (Rust) is the only process allowed to touch the filesystem
