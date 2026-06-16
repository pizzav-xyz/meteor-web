import { useMeteor } from "@/store/meteor-store";
import type { Module } from "@/lib/modules-data";
import { formatName } from "@/lib/modules-data";

export function ModuleRow({ module }: { module: Module }) {
  const { active, toggle, openModule } = useMeteor();
  const isActive = active.has(module.id);

  return (
    <button
      type="button"
      onClick={() => toggle(module.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        openModule(module.id);
      }}
      className={`group relative w-full px-3 py-1 text-center font-display text-xl tracking-wide transition-colors duration-100 hover:bg-window-row-hover cursor-pointer ${
        isActive ? "accent-strip text-row-text-active" : "text-row-text"
      }`}
    >
      {formatName(module.name)}
    </button>
  );
}
