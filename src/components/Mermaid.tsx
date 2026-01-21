"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: true,
  theme: "dark",
  themeVariables: {
    primaryColor: "#E2FF00",
    primaryTextColor: "#fff",
    primaryBorderColor: "#E2FF00",
    lineColor: "#ffffff",
    secondaryColor: "#1e293b",
    tertiaryColor: "#0f172a",
  },
  securityLevel: "loose",
});

export default function Mermaid({ chart }: { chart: string }) {
  const [svg, setSvg] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (chart) {
        try {
          const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart);
          setSvg(svg);
        } catch (error) {
          console.error("Mermaid rendering failed:", error);
        }
      }
    };

    renderChart();
  }, [chart]);

  return (
    <div 
      className="w-full overflow-x-auto flex justify-center p-4 bg-white/5 rounded-3xl border border-white/10"
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
}
