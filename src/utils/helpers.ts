import { Item } from "../types";

export function truncate(text: string, length = 120) {
  if (!text) return "";
  return text.length > length ? text.slice(0, length - 1) + "…" : text;
}

export type GenderValue = string | undefined | null;

export function formatGender(value?: GenderValue): string {
  if (!value) return "—";

  switch (value.toString().toLowerCase()) {
    case "male":
      return "Male";
    case "female":
      return "Female";
    case "other":
      return "Other";
    default:
      return value.toString();
  }
}

export function findItemById(items: Item[], id: string): Item | undefined {
  return items.find((i) => i.id === id);
}
