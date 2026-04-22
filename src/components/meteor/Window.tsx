import { ChevronDown, ChevronUp } from "lucide-react";
import { useState, type ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function MeteorWindow({ title, children, defaultOpen = true, className = "" }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`window-in flex flex-col border border-window-border bg-window-bg backdrop-blur-sm ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onContextMenu={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className="header-gradient flex items-center justify-center gap-2 px-3 py-1.5 font-display text-xl text-header-text tracking-wide select-none cursor-pointer"
      >
        <span>{title}</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && <div className="flex flex-col">{children}</div>}
    </div>
  );
}
