export type MockResult =
  | { kind: "text"; text: string }
  | { kind: "tool"; name: "trash_path"; path: string; text: string };

/** Parse simple Chinese/English intents for local demo without an API key. */
export async function mockChat(userText: string): Promise<MockResult> {
  const t = userText.trim();
  const trashMatch = t.match(
    /(?:丢|删除|删掉|trash|delete)\s*(?:进废纸篓|到废纸篓|到垃圾桶)?\s*[「"']?([^」"']+?)[」"']?\s*$/i,
  );
  if (/废纸篓|垃圾桶|trash/i.test(t) && (trashMatch || /桌面|Desktop/i.test(t))) {
    const path =
      trashMatch?.[1]?.trim() ||
      "~/Desktop/apsara-trash-demo.txt";
    const normalized = path.startsWith("~") || path.startsWith("/")
      ? path
      : `~/Desktop/${path}`;
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
