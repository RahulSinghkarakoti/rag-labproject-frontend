import type { Metadata } from "next";
import { ProjectsDashboard } from "@/components/project/projects-dashboard";

export const metadata: Metadata = {
  title: "System Projects // Workspace Nodes",
  description:
    "Deploy, configure, and manage neural workspace nodes, index engineering and research documents, and engage grounded RAG query sessions.",
  openGraph: {
    title: "System Projects // Workspace Nodes | RAG-LAB",
    description:
      "Deploy, configure, and manage neural workspace nodes, index engineering and research documents, and engage grounded RAG query sessions.",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RAG-LAB Workspace Nodes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "System Projects // Workspace Nodes | RAG-LAB",
    description:
      "Deploy, configure, and manage neural workspace nodes, index engineering and research documents, and engage grounded RAG query sessions.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <ProjectsDashboard />;
}
