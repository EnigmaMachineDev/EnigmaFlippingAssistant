import { useStore } from "@/lib/store";

export function useActiveProfile() {
  return useStore((s) => s.profiles.find((p) => p.id === s.activeProfileId) ?? null);
}

export function useProfiles() {
  return useStore((s) => s.profiles);
}

export function useProfileActions() {
  const addProfile = useStore((s) => s.addProfile);
  const updateProfile = useStore((s) => s.updateProfile);
  const deleteProfile = useStore((s) => s.deleteProfile);
  const setActiveProfile = useStore((s) => s.setActiveProfile);
  return { addProfile, updateProfile, deleteProfile, setActiveProfile };
}
