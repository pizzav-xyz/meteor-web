import { useMeteor } from "@/store/meteor-store";
import type { Category } from "@/lib/modules-data";
import { MeteorWindow } from "./Window";
import { ModuleRow } from "./ModuleRow";

interface Props {
  category: Category;
  x: number;
  y: number;
  width: number;
}

export function CategoryWindow({ category, x, y, width }: Props) {
  const allModules = useMeteor((s) => s.modules);
  const modules = allModules.filter((m) => m.category === category);
  if (modules.length === 0) return null;
  return (
    <MeteorWindow
      title={category}
      initialX={x}
      initialY={y}
      width={width}
      storageKey={`cat-${category}`}
    >
      {modules.map((m) => <ModuleRow key={m.id} module={m} />)}
    </MeteorWindow>
  );
}
