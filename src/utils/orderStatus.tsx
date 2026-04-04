import React from "react";
import { Badge } from "@/components/ui/badge";

/**
 * Unified order status config — single source of truth for colors, labels, and badges.
 * Use this across all pages so statuses look identical everywhere.
 */
export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; statBg: string; statText: string; statBorder: string }
> = {
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    statBg: "bg-amber-50",
    statText: "text-amber-800",
    statBorder: "border-amber-200",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    statBg: "bg-orange-50",
    statText: "text-orange-800",
    statBorder: "border-orange-200",
  },
  ready: {
    label: "Ready",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    statBg: "bg-emerald-50",
    statText: "text-emerald-800",
    statBorder: "border-emerald-200",
  },
  completed: {
    label: "Completed",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    statBg: "bg-slate-50",
    statText: "text-slate-700",
    statBorder: "border-slate-200",
  },
};

export const getStatusConfig = (status: string) =>
  ORDER_STATUS_CONFIG[status] ?? ORDER_STATUS_CONFIG["pending"];

export const StatusBadge = ({ status }: { status: string }) => {
  const cfg = getStatusConfig(status);
  return (
    <Badge
      variant="outline"
      className={`${cfg.bg} ${cfg.text} ${cfg.border} px-2 py-0.5 text-xs font-medium`}
    >
      {cfg.label}
    </Badge>
  );
};
