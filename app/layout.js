import "./globals.css";
import Providers from "@/components/Providers";
import { LanguageProvider } from "@/context/LanguageContext";
import { StoreProvider } from "@/context/StoreContext";
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "SHUNO | Voice-Enabled Clinical Assessment",
  description: "AI-assisted voice history taking for Union Health Complexes, Bangladesh",
  icons: {
    icon: "/logo.png",
  },
};

export const dynamic = "force-dynamic";

export const viewport = {
  themeColor: "#0d47a1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white text-primary antialiased font-sans">
        <Providers>
          <LanguageProvider>
            <StoreProvider>
              <AppShell>{children}</AppShell>
            </StoreProvider>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
