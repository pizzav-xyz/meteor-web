import { CATEGORIES } from "@/lib/modules-data";
import { CategoryWindow } from "./CategoryWindow";
import { SearchWindow } from "./SearchWindow";
import { FavoritesWindow } from "./FavoritesWindow";
import { ModuleSettingsScreen } from "./ModuleSettingsScreen";
import { useMeteor } from "@/store/meteor-store";
import { useEffect, useState } from "react";

const COL_WIDTH = 170;
const COL_GAP = 12;
const START_X = 16;
const START_Y = 56;

export function ModulesScreen() {
  const [open, setOpen] = useState(true);
  const favorites = useMeteor((s) => s.favorites);
  const openModuleId = useMeteor((s) => s.openModuleId);

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

  const colX = (i: number) => START_X + i * (COL_WIDTH + COL_GAP);
  const settingsOpen = openModuleId !== null;

  return (
    <div className="mc-bg relative w-screen h-screen overflow-hidden">
      <div className="relative z-10 flex items-center justify-center pt-3 pb-2">
        <h1 className="font-display text-2xl tracking-widest text-header-text tab-active px-4">
          Modules
        </h1>
      </div>

      {settingsOpen ? (
        <ModuleSettingsScreen />
      ) : (
        <>
          {CATEGORIES.map((cat, i) => (
            <CategoryWindow
              key={cat}
              category={cat}
              x={colX(i)}
              y={START_Y}
              width={COL_WIDTH}
            />
          ))}
          <SearchWindow x={colX(3)} y={START_Y - 8} width={COL_WIDTH} />
          {favorites.size > 0 && (
            <FavoritesWindow x={colX(4)} y={START_Y - 8} width={COL_WIDTH} />
          )}

          <div className="absolute bottom-2 left-3 z-10 font-display text-base text-help-text leading-tight">
            <div>Left click - Toggle module</div>
            <div>Right click - Open module settings</div>
            <div className="opacity-70 mt-1">Drag headers to move • Right click header to collapse</div>
          </div>
        </>
      )}
    </div>
  );
}
