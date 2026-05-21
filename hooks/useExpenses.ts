import { useStore } from "@/lib/store";

export function useExpenses() {
  return useStore((s) => s.expenses.filter((e) => e.profileId === s.activeProfileId));
}

export function useExpenseActions() {
  const addExpense = useStore((s) => s.addExpense);
  const updateExpense = useStore((s) => s.updateExpense);
  const deleteExpense = useStore((s) => s.deleteExpense);
  return { addExpense, updateExpense, deleteExpense };
}
