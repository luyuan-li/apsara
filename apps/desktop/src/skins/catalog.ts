import type { SkinCatalog, SkinItem } from "../types/skins";

const FALLBACK: SkinCatalog = {
  version: 1,
  skins: [
    {
      id: "guofeng",
      name: "飞天",
      kind: "image",
      preview: "/pets/guofeng/apsara.png",
      src: "/pets/guofeng/apsara.png",
      tags: ["古风", "默认"],
      blurb: "敦煌飞天风插画，默认皮肤",
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
