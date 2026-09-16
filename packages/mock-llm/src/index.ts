export type MockResult =
  | { kind: "text"; text: string }
  | { kind: "tool"; name: "trash_path"; path: string; text: string };

function looksLikeTrashIntent(t: string): boolean {
  return /废纸篓|垃圾桶|(?:^|[^\w-])(?:trash|delete)(?:[^\w-]|$)|丢进|删掉|删除/i.test(t);
}

/** Prefer real filenames / paths; never treat mid-token "trash" in apsara-trash-demo as a verb. */
function extractTrashTarget(t: string): string | null {
  const quoted = t.match(/[「"']([^「"']+\.[A-Za-z0-9]+)[」"']/);
  if (quoted?.[1]) return quoted[1].trim();

  const desktopNamed = t.match(
    /(?:桌面上的|桌面的|Desktop[/\\]?)\s*([A-Za-z0-9._-]+\.[A-Za-z0-9]+)/i,
  );
  if (desktopNamed?.[1]) return desktopNamed[1].trim();

  const absolute = t.match(/(~\/[^\s「」"']+|\/Users\/[^\s「」"']+)/);
  if (absolute?.[1]) {
    return absolute[1].replace(/[，。！？、]+$/u, "").trim();
  }

  const anyFile = t.match(/\b([A-Za-z0-9._-]+\.[A-Za-z0-9]{1,8})\b/);
  if (anyFile?.[1]) return anyFile[1].trim();

  return null;
}

function normalizePath(path: string): string {
  if (path.startsWith("~") || path.startsWith("/")) return path;
  return `~/Desktop/${path}`;
}

/** Parse simple Chinese/English intents for local demo without an API key. */
export async function mockChat(userText: string): Promise<MockResult> {
  const t = userText.trim();

  if (looksLikeTrashIntent(t)) {
    const extracted = extractTrashTarget(t) || "apsara-trash-demo.txt";
    const normalized = normalizePath(extracted);
    return {
      kind: "tool",
      name: "trash_path",
      path: normalized,
      text: `想把这个文件送进废纸篓：\`${normalized}\`\n需要你点确认哦。`,
    };
  }

  return {
    kind: "text",
    text: `（飞天 · mock）收到啦：「${t}」\n试试说：把桌面上的 apsara-trash-demo.txt 丢进废纸篓`,
  };
}
