import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import type { OrderStatus } from "@/lib/types";
import { cn, STATUS_LABEL } from "@/lib/utils";

const STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-500/10 text-amber-300 ring-amber-500/25",
  completed: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25",
  cancelled: "bg-red-500/10 text-red-300 ring-red-500/25",
};

const ICONS = { pending: Clock3, completed: CheckCircle2, cancelled: XCircle };

export function StatusBadge({ status, short, className }: { status: OrderStatus; short?: boolean; className?: string }) {
  const Icon = ICONS[status];
  const label = short && status === "pending" ? "Menunggu" : STATUS_LABEL[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1", STYLES[status], className)}>
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
