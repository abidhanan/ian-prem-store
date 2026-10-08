import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";
import { SUPABASE_ANON_KEY, SUPABASE_CONFIGURED, SUPABASE_URL } from "@/lib/config";
import type { Profile } from "@/lib/types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Dipanggil dari Server Component — sesi di-refresh oleh proxy.
        }
      },
    },
  });
}

/** User + profil yang sedang login (di-cache per request). */
export const getCurrentUser = cache(async (): Promise<{ id: string; email: string | null; profile: Profile | null } | null> => {
  await connection(); // selalu render per-request (data per pengguna)
  if (!SUPABASE_CONFIGURED) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
  return { id: data.user.id, email: data.user.email ?? null, profile: (profile as Profile) ?? null };
});
