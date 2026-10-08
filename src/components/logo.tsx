import Link from "next/link";
import { Crown } from "lucide-react";
import { SITE_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  const [first, ...rest] = SITE_NAME.split(" ");
  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/30 transition-transform group-hover:rotate-6">
        <Crown className="size-5 text-white" strokeWidth={2.5} />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        {first}
        {rest.length > 0 && <span className="text-gradient"> {rest.join(" ")}</span>}
      </span>
    </Link>
  );
}
