import { CATEGORIES } from "@/lib/modules-data";
import { CategoryWindow } from "./CategoryWindow";
import { SearchWindow } from "./SearchWindow";
import { FavoritesWindow } from "./FavoritesWindow";
import { ModuleSettingsScreen } from "./ModuleSettingsScreen";
import { useMeteor } from "@/store/meteor-store";
import { useEffect, useState } from "react";

export function ModulesScreen() {
  const [open, setOpen] = useState(true);
  const favorites = useMeteor((s) => s.favorites);

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
      <div className="relative z-10 flex items-center justify-center pt-3 pb-2">
        <h1 className="font-display text-2xl tracking-widest text-header-text tab-active px-4">
          Modules
        </h1>
      </div>

      <div className="relative z-10 px-3 pb-12 h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="grid grid-cols-6 gap-2 h-full items-start">
          {CATEGORIES.map((cat, i) => (
            <div key={cat} className="flex flex-col gap-2 max-h-full overflow-y-auto thin-scroll pr-1">
              <CategoryWindow category={cat} />
              {i === 3 && <SearchWindow />}
              {i === 4 && favorites.size > 0 && <FavoritesWindow />}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-2 left-3 z-10 font-display text-base text-help-text leading-tight">
        <div>Left click - Toggle module</div>
        <div>Right click - Open module settings</div>
      </div>

      <ModuleSettingsScreen />
    </div>
  );
}
