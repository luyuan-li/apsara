# Tool protocol (MVP)

## Risk
| Risk | Behavior |
|------|----------|
| `safe` | 立即经 Tauri 执行 |
| `confirm` | UI 确认后再执行 |
| `forbidden` | 不注册给模型 |

## Built-in tools
| Name | Risk | Description |
|------|------|-------------|
| `list_desktop` | safe | 列出桌面文件名（只读） |
| `reveal_in_finder` | safe | Finder 中显示 |
| `open_path` | confirm | `open` 打开 |
| `trash_path` | confirm | 移到废纸篓 |

## Example tool call (model → app)
```json
{
  "id": "call_1",
  "type": "function",
  "function": {
    "name": "trash_path",
    "arguments": "{\"path\":\"~/Desktop/draft-test.txt\"}"
  }
}
```

## Confirm UI contract
- Title: 确认操作
- Body: 人类可读说明 + **绝对路径**
- Primary: 确认（执行）
- Secondary: 取消（向会话写入 tool 取消结果）

## Path resolution
1. Expand `~`
2. `canonicalize`（若目标不存在，canonicalize 父目录再拼接）
3. 必须落在白名单前缀下
