import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ThemeAccentProvider } from "@/components/theme-accent-provider";
import MobileWarning from "@/components/MobileWarning";

export const metadata: Metadata = {
  title: "assistant-ui with Assistant Transport",
  description:
    "An example of using assistant-ui with the assistant-transport runtime",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="scanlines font-mono bg-background text-foreground antialiased selection:bg-accent selection:text-[#0a0a0f]">
        <div className="flex h-svh w-full flex-col overflow-hidden">
          <SessionProvider>
            <ThemeAccentProvider>
              <MobileWarning />
              <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
            </ThemeAccentProvider>
          </SessionProvider>
        </div>
      </body>
    </html>
  );
}
