export type SkinKind = "image" | "live2d";

export interface SkinItem {
  id: string;
  name: string;
  kind: SkinKind;
  preview: string;
  src: string;
  tags?: string[];
  blurb?: string;
}

export interface SkinCatalog {
  version: number;
  skins: SkinItem[];
}
