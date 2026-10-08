import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 ring-1 ring-white/10">
          <Compass className="size-10 text-fuchsia-300" />
        </div>
        <p className="mt-6 font-display text-7xl font-extrabold text-gradient">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-white/50">Halaman yang kamu cari mungkin sudah dipindah atau tidak tersedia.</p>
        <Link href="/" className="btn-primary mt-8">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
