import modulesData from "./modules.json";

export type Category = string;

export type SettingType = "bool" | "int" | "double" | "enum" | "select" | "keybind" | "string" | "color" | "vector";

export type MediaType = "image" | "video";

export interface Media {
  type: MediaType;
  src: string;
  alt?: string;
  caption?: string;
}

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
  media?: Media;
}

export interface Module {
  id: string;
  name: string;
  category: Category;
  description: string;
  settings: Setting[];
  media?: Media;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function isSettingType(value: unknown): value is SettingType {
  return (
    value === "bool" ||
    value === "int" ||
    value === "double" ||
    value === "enum" ||
    value === "select" ||
    value === "keybind" ||
    value === "string" ||
    value === "color" ||
    value === "vector"
  );
}

function parseMedia(value: unknown): Media | undefined {
  if (!isRecord(value)) return undefined;

  const { type, src, alt, caption } = value;
  if ((type !== "image" && type !== "video") || typeof src !== "string") {
    return undefined;
  }

  return {
    type,
    src,
    ...(typeof alt === "string" ? { alt } : {}),
    ...(typeof caption === "string" ? { caption } : {}),
  };
}

function parseSetting(value: unknown): Setting {
  if (!isRecord(value)) {
    throw new Error("Invalid setting entry in modules.json");
  }

  const { name, type, group, value: settingValue, options, min, max, selectedCount, totalCount, media } = value;

  if (
    typeof name !== "string" ||
    !isSettingType(type) ||
    typeof group !== "string" ||
    (typeof settingValue !== "boolean" && typeof settingValue !== "number" && typeof settingValue !== "string")
  ) {
    throw new Error(`Invalid setting definition for \"${String(name)}\"`);
  }

  return {
    name,
    type,
    group,
    value: settingValue,
    ...(Array.isArray(options) && options.every((option) => typeof option === "string") ? { options } : {}),
    ...(typeof min === "number" ? { min } : {}),
    ...(typeof max === "number" ? { max } : {}),
    ...(typeof selectedCount === "number" ? { selectedCount } : {}),
    ...(typeof totalCount === "number" ? { totalCount } : {}),
    ...(parseMedia(media) ? { media: parseMedia(media) } : {}),
  };
}

function parseModule(value: unknown): Module {
  if (!isRecord(value)) {
    throw new Error("Invalid module entry in modules.json");
  }

  const { id, name, category, description, settings, media } = value;

  if (
    typeof id !== "string" ||
    typeof name !== "string" ||
    typeof category !== "string" ||
    typeof description !== "string" ||
    !Array.isArray(settings)
  ) {
    throw new Error(`Invalid module definition for \"${String(name)}\"`);
  }

  return {
    id,
    name,
    category,
    description,
    settings: settings.map(parseSetting),
    ...(parseMedia(media) ? { media: parseMedia(media) } : {}),
  };
}

const DEFAULT_MODULES: Module[] = Array.isArray(modulesData) ? modulesData.map(parseModule) : [];

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
