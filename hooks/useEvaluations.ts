import { useStore } from "@/lib/store";

export function useEvaluations() {
  return useStore((s) => s.evaluations.filter((e) => e.profileId === s.activeProfileId));
}

export function useEvaluation(id: string) {
  return useStore((s) => s.evaluations.find((e) => e.id === id));
}

export function usePendingEvaluations() {
  return useStore((s) =>
    s.evaluations.filter((e) => e.profileId === s.activeProfileId && e.outcome === "pending")
  );
}

export function useEvaluationActions() {
  const addEvaluation = useStore((s) => s.addEvaluation);
  const updateEvaluation = useStore((s) => s.updateEvaluation);
  const deleteEvaluation = useStore((s) => s.deleteEvaluation);
  return { addEvaluation, updateEvaluation, deleteEvaluation };
}
