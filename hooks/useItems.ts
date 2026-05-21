import { useStore } from "@/lib/store";
import type { ItemStatus, ItemKind } from "@/lib/types";

export function useItems() {
  return useStore((s) => s.items.filter((i) => i.profileId === s.activeProfileId));
}

export function useItem(id: string) {
  return useStore((s) => s.items.find((i) => i.id === id));
}

export function useItemsByStatus(status: ItemStatus) {
  return useStore((s) =>
    s.items.filter((i) => i.profileId === s.activeProfileId && i.status === status)
  );
}

export function useItemsByKind(kind: ItemKind) {
  return useStore((s) =>
    s.items.filter((i) => i.profileId === s.activeProfileId && i.kind === kind)
  );
}

export function useActiveItems() {
  return useStore((s) =>
    s.items.filter(
      (i) => i.profileId === s.activeProfileId && i.status !== "sold" && i.status !== "lost"
    )
  );
}

export function useItemActions() {
  const addItem = useStore((s) => s.addItem);
  const updateItem = useStore((s) => s.updateItem);
  const deleteItem = useStore((s) => s.deleteItem);
  return { addItem, updateItem, deleteItem };
}
