import { ImageResponse } from "next/og"
import { siteConfig } from "@afenda/shared/constants"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: 64,
          background: "linear-gradient(135deg, #0b1220 0%, #111827 45%, #0a1b2a 100%)",
          color: "#f8fafc",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          {siteConfig.name}
        </div>
        <div
          style={{
            fontSize: 26,
            opacity: 0.85,
            maxWidth: 1000,
            lineHeight: 1.3,
          }}
        >
          {siteConfig.description}
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 18,
            opacity: 0.7,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
          }}
        >
          AFENDA
        </div>
      </div>
    ),
    size
  )
}
