import { Item } from "../types";

export function truncate(text: string, length = 120) {
  if (!text) return "";
  return text.length > length ? text.slice(0, length - 1) + "…" : text;
}

export function findItemById(items: Item[], id: string): Item | undefined {
  return items.find((i) => i.id === id);
}
