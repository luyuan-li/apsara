# macOS notes

## Window
- Transparent, always-on-top pet window
- Click-through when the cursor is outside the character hit area
- Lock mode disables click-through so chat/settings stay clickable

## Trash
- Prefer the system `trash` CLI when available
- Fallback: AppleScript “move to trash”
- MVP must never default to `rm`

## Live2D / Cubism
- Sample models and the Cubism SDK have **separate** licenses from this repo’s MIT
- Do not redistribute proprietary models without permission

## Later (not MVP)
- Accessibility / UI automation permissions only if you add input injection plugins

## MVP permission matrix
| Capability | Needed in MVP? |
|------------|----------------|
| Files in allowlisted folders | Yes (user-granted implicitly by choosing paths) |
| Trash | Yes (system trash APIs) |
| Accessibility (UI automation) | No |
| Screen Recording | No |
| Microphone | No (until ASR) |
