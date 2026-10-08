import { BadgeCheck, ShieldCheck, Zap } from "lucide-react";
import { Logo } from "@/components/logo";
import { SetupNotice } from "@/components/setup-notice";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SetupNotice />
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-700 to-pink-600 p-12 lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.25),transparent_45%)]" />
          <div className="absolute -bottom-32 -right-32 size-[28rem] rounded-full bg-black/20 blur-3xl" />
          <div className="grid-bg absolute inset-0 opacity-50" />
          <Logo className="relative" />
          <div className="relative my-auto max-w-md">
            <h2 className="font-display text-4xl font-bold leading-tight text-white">
              Semua aplikasi premium favoritmu, dalam satu tempat.
            </h2>
            <p className="mt-4 text-lg text-white/75">Login untuk bertransaksi dan akses akun premium yang sudah kamu beli.</p>
            <ul className="mt-10 space-y-4">
              {[
                { icon: ShieldCheck, text: "Akun bergaransi selama masa aktif" },
                { icon: Zap, text: "Akun langsung terkirim ke dashboard" },
                { icon: BadgeCheck, text: "Dipercaya ribuan pelanggan" },
              ].map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-white/90">
                  <span className="grid size-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
                    <f.icon className="size-5" />
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-sm text-white/60">© {new Date().getFullYear()} — Belanja aman & nyaman</p>
        </div>

        <div className="relative flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -right-20 top-10 size-96 rounded-full bg-fuchsia-600/15 blur-[100px]" />
            <div className="absolute -left-20 bottom-10 size-96 rounded-full bg-violet-600/15 blur-[100px]" />
          </div>
          <div className="w-full max-w-md">
            <Logo className="mb-8 lg:hidden" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
