export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:mb-8 sm:flex-row sm:items-end sm:gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-xs text-white/50 sm:text-sm">{description}</p>}
      </div>
      {action && <div className="grid grid-cols-2 gap-2 [&>*:only-child]:col-span-2 sm:flex sm:flex-wrap">{action}</div>}
    </div>
  );
}
