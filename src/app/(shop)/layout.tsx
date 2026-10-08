import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { SetupNotice } from "@/components/setup-notice";
import { WhatsappFloat } from "@/components/whatsapp-float";

export default function ShopLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      {/* Background aurora */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-[36rem] rounded-full bg-violet-700/25 blur-[120px] animate-float-slow" />
        <div className="absolute -right-32 top-1/4 size-[30rem] rounded-full bg-fuchsia-600/15 blur-[120px] animate-float" />
        <div className="absolute bottom-0 left-1/3 size-[28rem] rounded-full bg-cyan-500/10 blur-[120px] animate-float-slow" />
      </div>
      <SetupNotice />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsappFloat />
    </div>
  );
}
