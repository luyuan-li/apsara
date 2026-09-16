export type ToolRisk = "safe" | "confirm" | "forbidden";

export interface ToolDef {
  name: string;
  description: string;
  risk: ToolRisk;
  parameters: Record<string, unknown>;
}

export const MVP_TOOLS: ToolDef[] = [
  {
    name: "list_desktop",
    description: "List file names on the user Desktop (read-only).",
    risk: "safe",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "reveal_in_finder",
    description: "Reveal a path in Finder.",
    risk: "safe",
    parameters: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
      additionalProperties: false,
    },
  },
  {
    name: "open_path",
    description: "Open a file, folder, or application.",
    risk: "confirm",
    parameters: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
      additionalProperties: false,
    },
  },
  {
    name: "trash_path",
    description: "Move a path to the macOS Trash (recoverable).",
    risk: "confirm",
    parameters: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
      additionalProperties: false,
    },
  },
];
