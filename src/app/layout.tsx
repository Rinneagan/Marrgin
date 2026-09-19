import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ZenProvider } from "@/context/ZenContext";
import ParticleRing from "@/components/ParticleRing";

const cormorant = Cormorant_Garamond({ 
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"], 
  variable: "--font-cormorant" 
});

export const metadata: Metadata = {
  metadataBase: new URL("https://marrgin.com"),
  title: {
    default: "Marrgin — Observing, Questioning, and Documenting Ghana",
    template: "%s | Marrgin",
  },
  description: "An independent publication observing Ghana through writing, reporting, fieldwork, and evidence.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://marrgin.com",
    siteName: "Marrgin",
    title: "Marrgin — Observing, Questioning, and Documenting Ghana",
    description: "An independent publication observing Ghana through writing, reporting, fieldwork, and evidence.",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Marrgin Editorial Publication",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marrgin — Observing, Questioning, and Documenting Ghana",
    description: "An independent publication observing Ghana through writing, reporting, fieldwork, and evidence.",
    images: ["/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${cormorant.variable}`}>
      <body className="bg-background text-black antialiased font-sans selection:bg-accent/30 selection:text-accent-foreground">
        <AuthProvider>
          <ZenProvider>
            <ParticleRing />
            {children}
          </ZenProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
