import { useMeteor } from "@/store/meteor-store";
import type { Category } from "@/lib/modules-data";
import { MeteorWindow } from "./Window";
import { ModuleRow } from "./ModuleRow";

export function CategoryWindow({ category }: { category: Category }) {
  const modules = useMeteor((s) => s.modules.filter((m) => m.category === category));
  if (modules.length === 0) return null;
  return (
    <MeteorWindow title={category}>
      {modules.map((m) => <ModuleRow key={m.id} module={m} />)}
    </MeteorWindow>
  );
}
