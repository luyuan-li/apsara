import type { SkinCatalog, SkinItem } from "../types/skins";

const FALLBACK: SkinCatalog = {
  version: 1,
  skins: [
    {
      id: "live2d-mao",
      name: "Mao",
      kind: "live2d",
      preview: "/pets/live2d/mao/Mao.2048/texture_00.png",
      src: "/pets/live2d/mao/Mao.model3.json",
      tags: ["Live2D", "样例"],
      blurb: "Live2D 官方样例 · 动态",
    },
  ],
};

export async function loadCatalog(): Promise<SkinCatalog> {
  try {
    const res = await fetch("/pets/catalog.json", { cache: "no-store" });
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as SkinCatalog;
    if (!data?.skins?.length) return FALLBACK;
    return data;
  } catch {
    return FALLBACK;
  }
}

export function findSkin(skins: SkinItem[], id: string): SkinItem | undefined {
  return skins.find((s) => s.id === id);
}
