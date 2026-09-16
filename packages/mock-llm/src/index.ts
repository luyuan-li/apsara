/** Tiny echo / tool-stub LLM for local UI wiring without an API key. */
export async function mockChat(userText: string): Promise<string> {
  return `（mock）收到：${userText}\n接上真模型后，这里会走 function calling。`;
}
