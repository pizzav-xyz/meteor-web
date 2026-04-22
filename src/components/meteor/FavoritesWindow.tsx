import { useMeteor } from "@/store/meteor-store";
import { MeteorWindow } from "./Window";
import { ModuleRow } from "./ModuleRow";

export function FavoritesWindow() {
  const { modules, favorites } = useMeteor();
  if (favorites.size === 0) return null;
  const favs = modules
    .filter((m) => favorites.has(m.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <MeteorWindow title="Favorites">
      {favs.map((m) => <ModuleRow key={m.id} module={m} />)}
    </MeteorWindow>
  );
}
