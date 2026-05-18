import { useStore } from "@/lib/store";

export function useSettings() {
  return useStore((s) => s.settings);
}

export function useSettingsActions() {
  const updateSettings = useStore((s) => s.updateSettings);
  return { updateSettings };
}
