import { useMeteor } from "@/store/meteor-store";
import { MeteorWindow } from "./Window";
import { SettingControl } from "./SettingControl";
import { Star, Copy, Clipboard, X } from "lucide-react";
import { useEffect, useMemo } from "react";

export function ModuleSettingsScreen() {
  const { openModuleId, openModule, modules, favorites, toggleFavorite, active, toggle } =
    useMeteor();

  const module = useMemo(
    () => modules.find((m) => m.id === openModuleId) ?? null,
    [modules, openModuleId]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && openModuleId) openModule(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openModuleId, openModule]);

  if (!module) return null;

  const isFav = favorites.has(module.id);
  const isActive = active.has(module.id);

  // group settings preserving order
  const groups: { name: string; settings: typeof module.settings }[] = [];
  for (const s of module.settings) {
    let g = groups.find((x) => x.name === s.group);
    if (!g) {
      g = { name: s.group, settings: [] };
      groups.push(g);
    }
    g.settings.push(s);
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-background/40 backdrop-blur-[2px]"
      onClick={() => openModule(null)}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto thin-scroll border border-window-border bg-window-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="header-gradient flex items-center px-2 py-1.5 gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite(module.id)}
            className="p-1 hover:scale-110 transition-transform"
            aria-label="favorite"
          >
            <Star
              className={`w-5 h-5 ${
                isFav ? "fill-yellow-300 text-yellow-300" : "text-header-text"
              }`}
            />
          </button>
          <h2 className="flex-1 text-center font-display text-2xl text-header-text tracking-wide">
            {module.name}
          </h2>
          <button
            type="button"
            onClick={() => openModule(null)}
            className="p-1 text-header-text hover:text-white"
            aria-label="close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="px-3 py-2 font-display text-lg text-row-text">
          {module.description}
        </div>

        {/* Groups */}
        {groups.map((g) => (
          <div key={g.name} className="border-t border-window-border">
            <div className="text-center font-display text-lg text-row-text py-1">
              — {g.name} —
            </div>
            {g.settings.map((s) => (
              <SettingControl key={s.name} moduleId={module.id} setting={s} />
            ))}
          </div>
        ))}

        {/* Footer */}
        <div className="border-t border-window-border flex items-center px-3 py-2 gap-3">
          <span className="font-display text-lg text-row-text">Active:</span>
          <button
            type="button"
            onClick={() => toggle(module.id)}
            className={`w-5 h-5 border border-window-border ${
              isActive ? "bg-meteor-purple" : "bg-input"
            }`}
          />
          <div className="flex-1" />
          <button
            type="button"
            className="p-1 border border-window-border text-row-text hover:border-meteor-purple"
            title="Copy config"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1 border border-window-border text-row-text hover:border-meteor-purple"
            title="Paste config"
          >
            <Clipboard className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
