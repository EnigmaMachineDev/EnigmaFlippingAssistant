import { useStore } from "@/lib/store";
import { DEFAULT_SETTINGS } from "@/lib/seed";

export function useSettings() {
  return useStore((s) => {
    const profile = s.profiles.find((p) => p.id === s.activeProfileId);
    return profile?.settings ?? DEFAULT_SETTINGS;
  });
}

export function useSettingsActions() {
  const updateSettings = useStore((s) => s.updateSettings);
  return { updateSettings };
}
