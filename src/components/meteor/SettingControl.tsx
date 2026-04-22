import type { Setting } from "@/lib/modules-data";
import { useMeteor } from "@/store/meteor-store";
import { ChevronDown, RotateCcw } from "lucide-react";

export function SettingControl({ moduleId, setting }: { moduleId: string; setting: Setting }) {
  const update = useMeteor((s) => s.updateSetting);

  const renderControl = () => {
    switch (setting.type) {
      case "bool":
        return (
          <button
            type="button"
            onClick={() => update(moduleId, setting.name, !setting.value)}
            className={`w-5 h-5 border border-window-border ${
              setting.value ? "bg-meteor-purple" : "bg-input"
            }`}
            aria-label={setting.name}
          />
        );
      case "enum":
        return (
          <div className="relative">
            <select
              value={String(setting.value)}
              onChange={(e) => update(moduleId, setting.name, e.target.value)}
              className="appearance-none bg-input border border-window-border px-2 pr-7 py-0.5 font-display text-lg text-row-text cursor-pointer focus:outline-none focus:border-meteor-purple"
            >
              {setting.options?.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-meteor-purple" />
          </div>
        );
      case "int":
      case "double": {
        const val = Number(setting.value);
        const min = setting.min ?? 0;
        const max = setting.max ?? 100;
        const step = setting.type === "int" ? 1 : 0.001;
        return (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="number"
              value={setting.type === "int" ? val : val.toFixed(3)}
              min={min}
              max={max}
              step={step}
              onChange={(e) => update(moduleId, setting.name, Number(e.target.value))}
              className="w-20 bg-input border border-window-border px-2 py-0.5 font-display text-lg text-row-text focus:outline-none focus:border-meteor-purple"
            />
            <div className="relative flex-1 h-1.5 bg-input rounded-full">
              <div
                className="absolute left-0 top-0 h-full bg-meteor-purple rounded-full"
                style={{ width: `${((val - min) / (max - min)) * 100}%` }}
              />
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={val}
                onChange={(e) => update(moduleId, setting.name, Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-meteor-purple shadow-md pointer-events-none"
                style={{ left: `calc(${((val - min) / (max - min)) * 100}% - 6px)` }}
              />
            </div>
          </div>
        );
      }
      case "select":
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="bg-input border border-window-border px-2 py-0.5 font-display text-lg text-row-text hover:border-meteor-purple"
            >
              Select
            </button>
            <span className="font-display text-lg text-muted-foreground">
              ({setting.selectedCount} selected)
            </span>
          </div>
        );
      case "keybind":
        return (
          <button
            type="button"
            className="bg-input border border-window-border px-3 py-0.5 font-display text-lg text-row-text hover:border-meteor-purple"
          >
            {String(setting.value)}
          </button>
        );
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-1">
      <label className="font-display text-lg text-row-text min-w-[180px]">
        {setting.name}
      </label>
      <div className="flex-1 flex items-center">{renderControl()}</div>
      <button
        type="button"
        className="text-muted-foreground hover:text-meteor-purple"
        title="Reset"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
}
