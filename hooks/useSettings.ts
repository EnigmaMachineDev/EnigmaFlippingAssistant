import { useStore } from "@/lib/store";

export function useSettings() {
  return useStore((s) => s.settings);
}

export function useSettingsActions() {
  return useStore((s) => ({ updateSettings: s.updateSettings }));
}
