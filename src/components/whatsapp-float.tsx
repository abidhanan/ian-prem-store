"use client";

import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/config";
import { WhatsappIcon } from "./whatsapp-icon";
import { whatsappLink } from "@/lib/utils";

export function WhatsappFloat() {
  const pathname = usePathname();
  // Di halaman detail produk, tombol melayang menutupi form pembelian & kartu info (pembayaran sudah lewat WhatsApp)
  if (pathname.startsWith("/products/")) return null;
  return (
    <a
      href={whatsappLink(`Halo Admin ${SITE_NAME}, saya ingin bertanya.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp"
      className="group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40 grid size-12 place-items-center rounded-full sm:bottom-5 sm:right-5 sm:size-14 bg-gradient-to-br from-emerald-400 to-green-600 shadow-xl shadow-emerald-600/40 transition hover:scale-110"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40 [animation-duration:2.5s]" />
      <WhatsappIcon className="relative size-6 text-white sm:size-7" />
    </a>
  );
}
