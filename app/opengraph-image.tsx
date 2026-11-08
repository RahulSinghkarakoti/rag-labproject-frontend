import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "RAG-LAB // Neural Knowledge & RAG Studio";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0a0f",
          padding: "60px",
          fontFamily: "monospace",
          border: "2px solid #2a2a3a",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #00f0ff",
              backgroundColor: "#12121a",
              padding: "8px 16px",
              color: "#00f0ff",
              fontSize: 18,
              letterSpacing: "0.15em",
            }}
          >
            &gt; SYS.RAG_TERMINAL // V4.0
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: "#10b981",
              fontSize: 18,
              gap: 8,
            }}
          >
            ● ACTIVE_CLUSTER
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            RAG-LAB
          </div>
          <div
            style={{
              height: 4,
              width: 320,
              backgroundColor: "#00f0ff",
            }}
          />
          <div
            style={{
              fontSize: 26,
              color: "#e0e0e0",
              marginTop: 8,
            }}
          >
            Grounded Neural Retrieval-Augmented Generation Studio
          </div>
          <div
            style={{
              fontSize: 20,
              color: "#8a8a9a",
            }}
          >
            Multi-Document Ingestion • Hybrid Vector Search • Query Terminal
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #2a2a3a",
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex", gap: "16px" }}>
            <div
              style={{
                backgroundColor: "#12121a",
                border: "1px solid #2a2a3a",
                color: "#00f0ff",
                padding: "8px 16px",
                fontSize: 16,
              }}
            >
              [ VECTOR EMBEDDINGS ]
            </div>
            <div
              style={{
                backgroundColor: "#12121a",
                border: "1px solid #2a2a3a",
                color: "#00f0ff",
                padding: "8px 16px",
                fontSize: 16,
              }}
            >
              [ STREAMING RAG ]
            </div>
            <div
              style={{
                backgroundColor: "#12121a",
                border: "1px solid #2a2a3a",
                color: "#00f0ff",
                padding: "8px 16px",
                fontSize: 16,
              }}
            >
              [ CITATIONS ]
            </div>
          </div>
          <div
            style={{
              color: "#606070",
              fontSize: 16,
            }}
          >
            SYS.VER // 2026.11
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
