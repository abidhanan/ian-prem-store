import { Crown } from "lucide-react";

/** Layar loading bertema: menutupi seluruh layar, background gelap & blur, spinner tepat di tengah. */
export function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Memuat halaman"
      className="fixed inset-0 z-[400] grid place-items-center bg-ink-950/60 backdrop-blur-md animate-fade-in"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative grid size-20 place-items-center">
          <span className="absolute inset-0 rounded-full border-2 border-white/10" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-violet-400 border-t-fuchsia-400 [animation-duration:0.9s]" />
          <span className="absolute -inset-3 animate-pulse rounded-full bg-fuchsia-600/20 blur-xl" />
          <span className="relative grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/30">
            <Crown className="size-6 text-white" strokeWidth={2.5} />
          </span>
        </div>
        <p className="text-sm font-medium text-white/60">Memuat halaman...</p>
      </div>
    </div>
  );
}
