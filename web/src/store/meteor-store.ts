import { create } from "zustand";
import { createInitialModules, type Module } from "@/lib/modules-data";

interface State {
  modules: Module[];
  active: Set<string>;
  favorites: Set<string>;
  search: string;
  openModuleId: string | null;
  toggle: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setSearch: (s: string) => void;
  openModule: (id: string | null) => void;
  updateSetting: (moduleId: string, settingName: string, value: boolean | number | string) => void;
}

export const useMeteor = create<State>((set) => ({
  modules: createInitialModules(),
  active: new Set(["fullbright", "discord-presence"]),
  favorites: new Set(["kill-aura"]),
  search: "",
  openModuleId: null,
  toggle: (id) =>
    set((s) => {
      const next = new Set(s.active);
      next.has(id) ? next.delete(id) : next.add(id);
      return { active: next };
    }),
  toggleFavorite: (id) =>
    set((s) => {
      const next = new Set(s.favorites);
      next.has(id) ? next.delete(id) : next.add(id);
      return { favorites: next };
    }),
  setSearch: (search) => set({ search }),
  openModule: (openModuleId) => set({ openModuleId }),
  updateSetting: (moduleId, settingName, value) =>
    set((s) => ({
      modules: s.modules.map((m) =>
        m.id !== moduleId
          ? m
          : {
              ...m,
              settings: m.settings.map((st) => (st.name === settingName ? { ...st, value } : st)),
            },
      ),
    })),
}));
