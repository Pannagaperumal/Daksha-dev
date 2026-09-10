import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";
import Sidebar from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daksha",
  description: "Legal case management platform",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-full bg-neutral-50 text-neutral-900">
        <AuthProvider>
          <ToastProvider>
            <Sidebar />
            <main className="min-w-0 flex-1 overflow-y-auto">
              <div className="w-full px-8 py-8">{children}</div>
            </main>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
