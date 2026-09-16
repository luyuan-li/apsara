# 安全模型

## 原则
1. **文件系统只在 Rust/Tauri 侧执行**
2. **危险工具默认 confirm**
3. **路径白名单 + 规范化**，拒绝 `..` 与符号链接逃逸（能检测则拒绝）
4. **禁止** 向模型暴露任意 shell、`rm`、清空废纸篓

## 默认白名单
- `~/Desktop`
- `~/Downloads`
- `~/Documents`

用户可在设置中追加目录（实现期可后置；MVP 写死三者即可）。

## trash_path
- 只 `trash` / AppleScript move to trash
- 确认文案必须展示解析后的绝对路径
- 失败时返回可读错误，不重试硬删

## 密钥
- API Key 仅存本地配置 / 环境变量，不进 git，不进日志全文
