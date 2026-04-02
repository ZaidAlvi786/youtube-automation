import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NicheScope — Premium YouTube Intelligence",
  description:
    "High-velocity niche discovery, forensic video analysis, and AI-driven content strategy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, geistMono.variable, "h-full antialiased dark")}>
      <body className="min-h-full flex bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary-foreground">
        {/* Background Mesh */}
        <div className="fixed inset-0 z-0 mesh-gradient opacity-40 pointer-events-none" />

        {/* Sidebar (Client Component) */}
        <Sidebar />

        {/* Main content */}
        <main className="ml-64 relative z-10 flex-1 min-h-screen">
          <div className="mx-auto max-w-[1400px] px-10 py-12">
            {children}
          </div>
        </main>

        {/* Global Toast Notifications */}
        <Toaster 
          theme="dark" 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: "oklch(0.18 0.02 250 / 0.8)",
              backdropFilter: "blur(20px)",
              borderColor: "oklch(1 0 0 / 0.1)",
              color: "white",
            }
          }}
        />
      </body>
    </html>
  );
}
