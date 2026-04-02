// src/utils/exportData.js
// Export helpers for CSV, JSON, and print-to-PDF

export function exportCSV(videos, channelTitle = "channel") {
  const headers = [
    "Title", "Published Date", "Views", "Likes",
    "Comments", "Views/Day", "Duration", "Type", "URL",
  ];

  const rows = videos.map((v) => [
    `"${(v.title || "").replace(/"/g, '""')}"`,
    v.published_date || "",
    v.view_count,
    v.like_count,
    v.comment_count,
    v.views_per_day,
    v.duration_fmt,
    v.video_type,
    v.watch_url,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  _download(`${channelTitle}_videos.csv`, csv, "text/csv");
}

export function exportJSON(data, channelTitle = "channel") {
  const json = JSON.stringify(data, null, 2);
  _download(`${channelTitle}_analytics.json`, json, "application/json");
}

export function exportPDF() {
  window.print();
}

function _download(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
