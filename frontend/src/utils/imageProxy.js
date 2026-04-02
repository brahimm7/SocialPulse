// src/utils/imageProxy.js
const YOUTUBE_CDN_DOMAINS = [
  "yt3.ggpht.com",
  "i.ytimg.com",
  "i9.ytimg.com",
  "lh3.googleusercontent.com",
];

const BASE = import.meta.env.VITE_API_URL || "";

export function proxyImage(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const isYouTubeCDN = YOUTUBE_CDN_DOMAINS.some((d) =>
      parsed.hostname.endsWith(d)
    );
    if (isYouTubeCDN) {
      return `${BASE}/api/image-proxy/?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // Not a valid URL — return as-is
  }
  return url;
}
