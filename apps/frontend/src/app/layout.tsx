import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";


const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets:["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BookLeaf Author Support",
  description: "Author Support & Communication Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) { 
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
