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
  title: "Marrgin",
  description: "A reading experience for poetry",
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
