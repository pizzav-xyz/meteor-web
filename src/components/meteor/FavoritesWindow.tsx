import { useMeteor } from "@/store/meteor-store";
import { MeteorWindow } from "./Window";
import { ModuleRow } from "./ModuleRow";

interface Props { x: number; y: number; width: number }

export function FavoritesWindow({ x, y, width }: Props) {
  const { modules, favorites } = useMeteor();
  if (favorites.size === 0) return null;
  const favs = modules
    .filter((m) => favorites.has(m.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <MeteorWindow title="Favorites" initialX={x} initialY={y} width={width} storageKey="favorites">
      {favs.map((m) => <ModuleRow key={m.id} module={m} />)}
    </MeteorWindow>
  );
}
