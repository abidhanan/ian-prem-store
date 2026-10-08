import { SITE_NAME, WHATSAPP_DISPLAY } from "@/lib/config";
import { whatsappLink } from "@/lib/utils";
import { Logo } from "./logo";
import { WhatsappIcon } from "./whatsapp-icon";

export function Footer() {
  return (
    <footer className="relative mt-16 border-t border-white/[0.06] sm:mt-24">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 md:grid-cols-2 md:gap-10 lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
            Toko aplikasi premium terpercaya, harga bersahabat, proses cepat, dan bergaransi.
          </p>
        </div>
        <div className="md:justify-self-end">
          <h4 className="font-display text-sm font-semibold text-white">Butuh bantuan?</h4>
          <p className="mt-4 text-sm text-white/50">Hubungi admin via WhatsApp</p>
          <a
            href={whatsappLink(`Halo Admin ${SITE_NAME}, saya ingin bertanya.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2.5 text-sm font-semibold text-white/80 transition hover:text-emerald-300"
          >
            <WhatsappIcon className="size-6 text-emerald-400" />
            {WHATSAPP_DISPLAY}
          </a>
        </div>
      </div>
      <div className="border-t border-white/[0.06] px-4 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {SITE_NAME}. Hak cipta dilindungi.
      </div>
    </footer>
  );
}
