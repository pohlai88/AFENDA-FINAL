import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Afenda";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "linear-gradient(to bottom right, #1a1a2e, #16213e)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        Afenda
      </div>
    ),
    { ...size }
  );
}
