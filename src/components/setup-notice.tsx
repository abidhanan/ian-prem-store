import { AlertTriangle } from "lucide-react";
import { SUPABASE_CONFIGURED } from "@/lib/config";

export function SetupNotice() {
  if (SUPABASE_CONFIGURED) return null;
  return (
    <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-center text-xs text-amber-200">
      <AlertTriangle className="mr-1.5 inline size-3.5" />
      Supabase belum dikonfigurasi. Isi <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
      <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di file <code className="font-mono">.env.local</code>.
    </div>
  );
}
