import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shortId = id ? id.slice(0, 8) : "NODE";

  return {
    title: `Workspace Node [${shortId}]`,
    description: `Grounded RAG retrieval channel, document indexing, and neural knowledge base for workspace node ${shortId}.`,
    openGraph: {
      title: `Workspace Node [${shortId}] | RAG-LAB`,
      description: `Grounded RAG retrieval channel, document indexing, and neural knowledge base for workspace node ${shortId}.`,
      url: `/project/${id}`,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `Workspace Node [${shortId}]`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Workspace Node [${shortId}] | RAG-LAB`,
      description: `Grounded RAG retrieval channel, document indexing, and neural knowledge base for workspace node ${shortId}.`,
      images: ["/og-image.png"],
    },
    alternates: {
      canonical: `/project/${id}`,
    },
  };
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
