 
import type { Metadata } from "next";
import "./globals.css";
import AuthSessionHandler from "@/components/AuthSessionHandler";
import { SessionProvider } from "next-auth/react";
 
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
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex h-screen flex-col">
          <SessionProvider>
            <AuthSessionHandler>
          <main className="flex-1 overflow-hidden">{children}</main>
            </AuthSessionHandler>
        </SessionProvider>
        </div>
      </body>
    </html>
  );
}
