import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  initialX: number;
  initialY: number;
  width?: number;
  storageKey?: string;
}

const DRAG_THRESHOLD = 4;

export function MeteorWindow({
  title,
  children,
  defaultOpen = true,
  initialX,
  initialY,
  width = 170,
  storageKey,
}: Props) {
  const [pos, setPos] = useState(() => {
    if (storageKey && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`mw:${storageKey}`);
        if (raw) return JSON.parse(raw) as { x: number; y: number };
      } catch {}
    }
    return { x: initialX, y: initialY };
  });
  const [open, setOpen] = useState(defaultOpen);
  const [dragging, setDragging] = useState(false);

  const dragState = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(`mw:${storageKey}`, JSON.stringify(pos));
    } catch {}
  }, [pos, storageKey]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (!ds.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    ds.moved = true;
    setPos({ x: ds.origX + dx, y: ds.origY + dy });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const ds = dragState.current;
    dragState.current = null;
    setDragging(false);
    if (ds && !ds.moved && e.button === 0) {
      // Click without drag -> toggle expansion
      setOpen((o) => !o);
    }
  };

  return (
    <div
      className="absolute window-in flex flex-col border border-window-border bg-window-bg backdrop-blur-sm shadow-lg"
      style={{ left: pos.x, top: pos.y, width }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onContextMenu={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className={`header-gradient flex items-center justify-center gap-2 px-3 py-1.5 font-display text-xl text-header-text tracking-wide select-none ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <span>{title}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>
      {open && <div className="flex flex-col max-h-[80vh] overflow-y-auto thin-scroll">{children}</div>}
    </div>
  );
}
