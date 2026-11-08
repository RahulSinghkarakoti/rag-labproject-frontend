import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { ThemeAccentProvider } from "@/components/theme-accent-provider";
import MobileWarning from "@/components/MobileWarning";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rag-lab.local";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "RAG-LAB // Neural Knowledge & RAG Studio",
    template: "%s | RAG-LAB",
  },
  description:
    "Advanced grounded retrieval-augmented generation (RAG) studio. Ingest documents, build neural vector knowledge bases, and query with real-time stream responses.",
  keywords: [
    "RAG-LAB",
    "RAG",
    "Retrieval-Augmented Generation",
    "Vector Search",
    "Neural Knowledge Base",
    "Document Embeddings",
    "AI Assistant",
    "Query Terminal",
    "Hybrid Retrieval",
  ],
  authors: [{ name: "RAG-LAB Team" }],
  creator: "RAG-LAB",
  publisher: "RAG-LAB",
  applicationName: "RAG-LAB",
  generator: "Next.js",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: "RAG-LAB",
    title: "RAG-LAB // Neural Knowledge & RAG Studio",
    description:
      "Advanced grounded retrieval-augmented generation (RAG) studio. Ingest documents, build neural vector knowledge bases, and query with real-time stream responses.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RAG-LAB // Neural Knowledge & RAG Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RAG-LAB // Neural Knowledge & RAG Studio",
    description:
      "Advanced grounded retrieval-augmented generation (RAG) studio. Ingest documents, build neural vector knowledge bases, and query with real-time stream responses.",
    images: ["/og-image.png"],
    creator: "@rag_lab",
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
