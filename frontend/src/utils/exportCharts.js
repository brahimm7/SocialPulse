// src/utils/exportCharts.js
// Export individual charts as PNG images.
// Uses the browser's built-in Canvas API via SVG serialization —
// no external libraries needed.

/**
 * Export a DOM element (containing an SVG or canvas chart) as a PNG file.
 * @param {string} elementId  - id attribute of the chart wrapper div
 * @param {string} filename   - output file name (without extension)
 */
export async function exportChartAsPNG(elementId, filename = "chart") {
  const el = document.getElementById(elementId);
  if (!el) return;

  // Find SVG inside the element
  const svg = el.querySelector("svg");
  if (!svg) {
    alert("No chart found to export.");
    return;
  }

  // Serialize SVG
  const svgData   = new XMLSerializer().serializeToString(svg);
  const svgBlob   = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl    = URL.createObjectURL(svgBlob);

  // Draw onto a canvas
  const img    = new Image();
  const { width, height } = svg.getBoundingClientRect();

  img.onload = () => {
    const canvas    = document.createElement("canvas");
    const scale     = window.devicePixelRatio || 2; // retina-quality
    canvas.width    = width  * scale;
    canvas.height   = height * scale;
    const ctx       = canvas.getContext("2d");
    ctx.scale(scale, scale);
    // Dark background matching the app
    ctx.fillStyle   = "#0d0d0d";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob((blob) => {
      const a      = document.createElement("a");
      a.href       = URL.createObjectURL(blob);
      a.download   = `${filename}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(svgUrl);
    }, "image/png");
  };

  img.src = svgUrl;
}

/**
 * Export all charts on the page as separate PNGs in sequence.
 * @param {Array<{id: string, name: string}>} charts
 */
export async function exportAllCharts(charts) {
  for (const { id, name } of charts) {
    await exportChartAsPNG(id, name);
    // Small delay so browser doesn't batch-block downloads
    await new Promise((r) => setTimeout(r, 300));
  }
}
