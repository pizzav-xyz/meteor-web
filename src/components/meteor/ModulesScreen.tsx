import { CATEGORIES, TABS } from "@/lib/modules-data";
import { CategoryWindow } from "./CategoryWindow";
import { SearchWindow } from "./SearchWindow";
import { FavoritesWindow } from "./FavoritesWindow";
import { ModuleSettingsScreen } from "./ModuleSettingsScreen";
import { useMeteor } from "@/store/meteor-store";
import { useEffect, useState } from "react";

export function ModulesScreen() {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Modules");
  const favorites = useMeteor((s) => s.favorites);

  // Right Shift toggles GUI
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Shift" && e.location === 2) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) {
    return (
      <div className="mc-bg w-screen h-screen flex items-center justify-center">
        <div className="text-center font-display text-2xl text-help-text">
          Press <kbd className="px-2 py-0.5 border border-window-border bg-window-bg">Right Shift</kbd> to open Meteor GUI
        </div>
      </div>
    );
  }

  return (
    <div className="mc-bg relative w-screen h-screen overflow-hidden">
      {/* Tab bar */}
      <div className="relative z-10 flex items-center justify-center gap-1 pt-3 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1 font-display text-xl tracking-wide transition-colors ${
              tab === t
                ? "text-header-text tab-active"
                : "text-row-text hover:text-header-text"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Modules" ? (
        <div className="relative z-10 px-3 pb-12 h-[calc(100vh-3.5rem)] overflow-hidden">
          <div className="grid grid-cols-6 gap-2 h-full items-start">
            {CATEGORIES.map((cat, i) => (
              <div key={cat} className="flex flex-col gap-2 max-h-full overflow-y-auto thin-scroll pr-1">
                <CategoryWindow category={cat} />
                {/* Place Search in column 4 (Render), Favorites next to it */}
                {i === 3 && <SearchWindow />}
                {i === 4 && favorites.size > 0 && <FavoritesWindow />}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex items-center justify-center h-[calc(100vh-8rem)]">
          <div className="font-display text-3xl text-muted-foreground">
            {tab} — coming soon
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="absolute bottom-2 left-3 z-10 font-display text-base text-help-text leading-tight">
        <div>Left click - Toggle module</div>
        <div>Right click - Open module settings</div>
      </div>

      <ModuleSettingsScreen />
    </div>
  );
}
