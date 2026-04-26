import type { Setting } from "@/lib/modules-data";
import { useMeteor } from "@/store/meteor-store";
import { ChevronDown, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function SettingMedia({
  type,
  src,
  alt,
  caption,
}: {
  type: "image" | "video";
  src: string;
  alt?: string;
  caption?: string;
}) {
  return (
    <div className="mt-1 w-full border border-window-border bg-input p-2">
      {type === "image" ? (
        <img
          src={src}
          alt={alt ?? ""}
          className="block max-h-64 w-full border border-window-border object-cover"
        />
      ) : (
        <video
          src={src}
          controls
          muted
          playsInline
          preload="metadata"
          className="block max-h-64 w-full border border-window-border bg-window-bg"
        />
      )}
      {caption ? <div className="pt-2 font-display text-sm text-row-text">{caption}</div> : null}
    </div>
  );
}

function normalizeColorValue(value: string): string {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;

  const rgba = value.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)$/i);
  if (!rgba) return "#ffffff";

  return `#${[rgba[1], rgba[2], rgba[3]]
    .map((part) => Number(part).toString(16).padStart(2, "0"))
    .join("")}`;
}

function parseVector(value: string): [string, string, string] {
  const parts = value.split(",").map((part) => part.trim());
  return [parts[0] ?? "0", parts[1] ?? "0", parts[2] ?? "0"];
}

function CustomSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-input border border-window-border px-2 pr-1 py-0.5 font-display text-lg text-row-text hover:border-meteor-purple focus:outline-none focus:border-meteor-purple min-w-[8rem]"
      >
        <span className="flex-1 text-left">{value}</span>
        <ChevronDown className="w-4 h-4 text-meteor-purple" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-full border border-window-border bg-window-bg shadow-lg max-h-60 overflow-y-auto thin-scroll">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={`block w-full text-left px-2 py-1 font-display text-lg hover:bg-meteor-purple/30 ${
                o === value ? "text-meteor-purple" : "text-row-text"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelect({
  selectedCount,
  totalCount,
  pool,
  onChange,
}: {
  selectedCount: number;
  totalCount: number;
  pool: string[];
  onChange: (count: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (let i = 0; i < Math.min(selectedCount, pool.length); i++) s.add(pool[i]);
    return s;
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setSelected(next);
    onChange(next.size);
  };

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="bg-input border border-window-border px-2 py-0.5 font-display text-lg text-row-text hover:border-meteor-purple"
      >
        Select
      </button>
      <span className="font-display text-lg text-muted-foreground">
        ({selected.size} / {totalCount} selected)
      </span>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-64 border border-window-border bg-window-bg shadow-lg max-h-72 overflow-y-auto thin-scroll">
          {pool.map((o) => {
            const isSel = selected.has(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => toggle(o)}
                className="flex items-center gap-2 w-full text-left px-2 py-1 font-display text-base text-row-text hover:bg-meteor-purple/30"
              >
                <span
                  className={`w-4 h-4 border border-window-border ${
                    isSel ? "bg-meteor-purple" : "bg-input"
                  }`}
                />
                <span className="flex-1">{o}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
          <CustomSelect
            value={String(setting.value)}
            options={setting.options ?? []}
            onChange={(v) => update(moduleId, setting.name, v)}
          />
        );
      case "int":
      case "double": {
        const val = Number(setting.value);
        const min = setting.min ?? 0;
        const max = setting.max ?? 100;
        const step = setting.type === "int" ? 1 : 0.001;
        const display = setting.type === "int" ? String(val) : val.toFixed(3);
        return (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              inputMode={setting.type === "int" ? "numeric" : "decimal"}
              value={display}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!Number.isNaN(n)) update(moduleId, setting.name, n);
              }}
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
      case "select": {
        const pool = setting.options ?? [];
        const total = setting.totalCount ?? pool.length;
        return (
          <MultiSelect
            selectedCount={setting.selectedCount ?? 0}
            totalCount={total}
            pool={pool}
            onChange={() => {
              update(moduleId, setting.name, "");
            }}
            />
        );
      }
      case "string":
        return (
          <input
            type="text"
            value={String(setting.value)}
            onChange={(e) => update(moduleId, setting.name, e.target.value)}
            className="w-full max-w-xs bg-input border border-window-border px-2 py-0.5 font-display text-lg text-row-text focus:outline-none focus:border-meteor-purple"
          />
        );
      case "color": {
        const value = String(setting.value);
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={normalizeColorValue(value)}
              onChange={(e) => update(moduleId, setting.name, e.target.value)}
              className="h-8 w-10 rounded-none border border-window-border bg-input p-1"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => update(moduleId, setting.name, e.target.value)}
              className="w-32 bg-input border border-window-border px-2 py-0.5 font-display text-lg text-row-text focus:outline-none focus:border-meteor-purple"
            />
          </div>
        );
      }
      case "vector": {
        const [x, y, z] = parseVector(String(setting.value));
        const updateVector = (index: number, next: string) => {
          const parts = [x, y, z];
          parts[index] = next;
          update(moduleId, setting.name, parts.join(", "));
        };

        return (
          <div className="flex items-center gap-2">
            {[x, y, z].map((part, index) => (
              <input
                key={index}
                type="text"
                inputMode="decimal"
                value={part}
                onChange={(e) => updateVector(index, e.target.value)}
                className="w-16 bg-input border border-window-border px-2 py-0.5 font-display text-lg text-row-text focus:outline-none focus:border-meteor-purple"
              />
            ))}
          </div>
        );
      }
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
    <div className="px-3 py-1">
      <div className="flex items-center gap-3">
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
      {setting.media ? (
        <div className="mt-1 pl-[183px] pr-5">
          <SettingMedia {...setting.media} />
        </div>
      ) : null}
    </div>
  );
}
