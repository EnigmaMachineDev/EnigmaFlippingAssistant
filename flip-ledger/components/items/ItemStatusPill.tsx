import React from "react";
import { Pill } from "@/components/ui/Pill";
import { StatusColors } from "@/constants/colors";
import type { ItemStatus } from "@/lib/types";

const STATUS_LABELS: Record<ItemStatus, string> = {
  sourcing: "Sourcing",
  acquired: "Acquired",
  in_progress: "In Progress",
  listed: "Listed",
  sold: "Sold",
  lost: "Lost",
};

interface ItemStatusPillProps {
  status: ItemStatus;
  size?: "sm" | "default";
}

export function ItemStatusPill({ status, size }: ItemStatusPillProps) {
  return (
    <Pill
      label={STATUS_LABELS[status]}
      color={StatusColors[status]}
      size={size}
    />
  );
}
