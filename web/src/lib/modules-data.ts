import modulesData from "./modules.json";

export type Category = string;

export type SettingType = "bool" | "int" | "double" | "enum" | "select" | "keybind" | "string" | "color" | "vector";

export interface Setting {
  name: string;
  type: SettingType;
  group: string;
  value: boolean | number | string;
  options?: string[];
  min?: number;
  max?: number;
  selectedCount?: number;
  totalCount?: number;
}

export interface Module {
  id: string;
  name: string;
  category: Category;
  description: string;
  settings: Setting[];
}

const DEFAULT_MODULES = modulesData as Module[];

const BUILTIN_CATEGORY_ORDER = ["Combat", "Player", "Movement", "Render", "World", "Misc"] as const;

export function createInitialModules(): Module[] {
  return structuredClone(DEFAULT_MODULES);
}

export const CATEGORIES: Category[] = [
  ...BUILTIN_CATEGORY_ORDER.filter((category) => DEFAULT_MODULES.some((module) => module.category === category)),
  ...Array.from(
    new Set(
      DEFAULT_MODULES
        .map((module) => module.category)
        .filter((category) => !BUILTIN_CATEGORY_ORDER.includes(category as (typeof BUILTIN_CATEGORY_ORDER)[number])),
    ),
  ),
];
