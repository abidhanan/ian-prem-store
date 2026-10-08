import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { NavigationLoader } from "@/components/navigation-loader";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/config";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["600", "700", "800"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07060d",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s - ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} ${sora.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col font-sans">
        {children}
        <Suspense fallback={null}>
          <NavigationLoader />
        </Suspense>
        <Toaster
          theme="dark"
          position="top-center"
          richColors
          toastOptions={{ style: { background: "#15121f", border: "1px solid rgba(255,255,255,0.1)" } }}
        />
      </body>
    </html>
  );
}
