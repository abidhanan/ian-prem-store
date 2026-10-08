import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-fuchsia-300 ring-1 ring-white/10">
        {icon}
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold text-white">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-white/50">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
