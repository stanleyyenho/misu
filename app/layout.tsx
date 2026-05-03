import type { Metadata, Viewport } from "next";
import { Nunito, Nunito_Sans, Caveat, Silkscreen, Space_Grotesk, Space_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "misu — stay in touch",
  description: "Relationship maintenance — stay meaningfully connected with the people who matter",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "misu",
  },
  icons: {
    apple: "/icon-192.png",
    icon: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAFAFA",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${nunitoSans.variable} ${caveat.variable} ${silkscreen.variable} ${spaceGrotesk.variable} ${spaceMono.variable} ${bricolage.variable} antialiased`} style={{ fontFamily: "var(--font-space-grotesk), var(--font-nunito), sans-serif" }}>
        <div className="flex min-h-dvh">
          <SideNav />
          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>
        <BottomNav />
        <Toaster
          position="bottom-center"
          toastOptions={{
            className: "rounded-2xl font-sans",
            style: { fontFamily: "var(--font-sans)" },
          }}
        />
      </body>
    </html>
  );
}
