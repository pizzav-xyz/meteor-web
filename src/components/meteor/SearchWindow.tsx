import { useMeteor } from "@/store/meteor-store";
import { MeteorWindow } from "./Window";
import { ModuleRow } from "./ModuleRow";
import { useEffect, useMemo, useRef } from "react";

export function SearchWindow() {
  const { modules, search, setSearch } = useMeteor();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = search.trim().toLowerCase();
  const titleMatches = useMemo(
    () => (q ? modules.filter((m) => m.name.toLowerCase().includes(q)) : []),
    [modules, q]
  );
  const settingMatches = useMemo(
    () =>
      q
        ? modules.filter((m) =>
            m.settings.some((s) => s.name.toLowerCase().includes(q))
          )
        : [],
    [modules, q]
  );

  return (
    <MeteorWindow title="Search">
      <div className="px-2 py-2">
        <input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder=""
          className="w-full bg-input border border-window-border px-2 py-1 font-display text-lg text-row-text outline-none focus:border-meteor-purple"
        />
      </div>
      {q && (
        <div className="max-h-64 overflow-y-auto thin-scroll">
          {titleMatches.length > 0 && (
            <>
              <div className="px-3 py-1 font-display text-base text-help-text border-t border-window-border">
                Modules
              </div>
              {titleMatches.map((m) => <ModuleRow key={m.id} module={m} />)}
            </>
          )}
          {settingMatches.length > 0 && (
            <>
              <div className="px-3 py-1 font-display text-base text-help-text border-t border-window-border">
                Settings
              </div>
              {settingMatches.map((m) => <ModuleRow key={"s-" + m.id} module={m} />)}
            </>
          )}
          {titleMatches.length === 0 && settingMatches.length === 0 && (
            <div className="px-3 py-2 text-center font-display text-base text-muted-foreground">
              No results
            </div>
          )}
        </div>
      )}
    </MeteorWindow>
  );
}
