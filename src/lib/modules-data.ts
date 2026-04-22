import modulesData from "./modules.json";

export type Category = "Combat" | "Player" | "Movement" | "Render" | "World" | "Misc";

export type SettingType = "bool" | "int" | "double" | "enum" | "select" | "keybind";

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

export function createInitialModules(): Module[] {
  return structuredClone(DEFAULT_MODULES);
}

export const CATEGORIES: Category[] = ["Combat", "Player", "Movement", "Render", "World", "Misc"];

export const TABS = ["Modules", "Config", "GUI", "HUD", "Friends", "Macros", "Profiles"] as const;
export type Tab = (typeof TABS)[number];
