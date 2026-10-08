"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail, MailCheck, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/utils";

export function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const router = useRouter();
  const redirectTo = safeNext(next);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      setLoading(false);
      if (error) return toast.error(errorMessage(error));
      toast.success("Selamat datang kembali! 👋");
      router.replace(redirectTo);
      router.refresh();
      return;
    }

    if (form.password.length < 6) {
      setLoading(false);
      return toast.error("Password minimal 6 karakter");
    }
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.fullName.trim(), phone: form.phone.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    setLoading(false);
    if (error) return toast.error(errorMessage(error));
    if (data.session) {
      toast.success("Akun berhasil dibuat 🎉");
      router.replace(redirectTo);
      router.refresh();
    } else {
      setSentTo(form.email.trim());
    }
  }

  if (sentTo) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500/15">
          <MailCheck className="size-8 text-emerald-400" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-white">Cek Email Kamu</h1>
        <p className="mt-2 text-sm text-white/55">
          Kami telah mengirim link konfirmasi ke <b className="text-white">{sentTo}</b>. Klik link tersebut untuk mengaktifkan akun.
        </p>
        <Link href="/login" className="btn-ghost mt-6">
          Kembali ke Login
        </Link>
      </div>
    );
  }

  const isLogin = mode === "login";

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{isLogin ? "Masuk ke Akun" : "Buat Akun Baru"}</h1>
      <p className="mt-2 text-white/50">
        {isLogin ? "Masuk untuk melanjutkan transaksi kamu." : "Gratis! Daftar dan mulai belanja akun premium."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4 sm:mt-8">
        {!isLogin && (
          <>
            <Field icon={<User className="size-4" />} label="Nama Lengkap">
              <input required value={form.fullName} onChange={set("fullName")} placeholder="Nama kamu" className="input pl-10" />
            </Field>
            <Field icon={<Phone className="size-4" />} label="No. WhatsApp">
              <input required value={form.phone} onChange={set("phone")} placeholder="08xxxxxxxxxx" inputMode="tel" className="input pl-10" />
            </Field>
          </>
        )}
        <Field icon={<Mail className="size-4" />} label="Email">
          <input required type="email" value={form.email} onChange={set("email")} placeholder="kamu@email.com" autoComplete="email" className="input pl-10" />
        </Field>
        <Field icon={<Lock className="size-4" />} label="Password">
          <input
            required
            type={showPw ? "text" : "password"}
            value={form.password}
            onChange={set("password")}
            placeholder={isLogin ? "Password kamu" : "Minimal 6 karakter"}
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="input pl-10 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            aria-label="Tampilkan password"
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </Field>

        <button disabled={loading} className="btn-primary w-full py-3.5 text-base">
          {loading && <Loader2 className="size-5 animate-spin" />}
          {isLogin ? "Masuk" : "Daftar Sekarang"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
        <Link
          href={`${isLogin ? "/register" : "/login"}${next ? `?next=${encodeURIComponent(redirectTo)}` : ""}`}
          className="font-semibold text-fuchsia-300 hover:underline"
        >
          {isLogin ? "Daftar gratis" : "Masuk di sini"}
        </Link>
      </p>
      <p className="mt-3 text-center text-sm">
        <Link href="/" className="text-white/40 hover:text-white">
          ← Kembali ke toko
        </Link>
      </p>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35">{icon}</span>
        {children}
      </div>
    </div>
  );
}
