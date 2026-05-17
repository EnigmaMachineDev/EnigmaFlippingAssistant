import { useStore } from "@/lib/store";

export function useEvaluations() {
  return useStore((s) => s.evaluations);
}

export function useEvaluation(id: string) {
  return useStore((s) => s.evaluations.find((e) => e.id === id));
}

export function usePendingEvaluations() {
  return useStore((s) => s.evaluations.filter((e) => e.outcome === "pending"));
}

export function useEvaluationActions() {
  return useStore((s) => ({
    addEvaluation: s.addEvaluation,
    updateEvaluation: s.updateEvaluation,
    deleteEvaluation: s.deleteEvaluation,
  }));
}
