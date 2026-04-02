// src/utils/imageProxy.js
// Routes YouTube CDN images through the Django image-proxy endpoint.
// This bypasses CORS restrictions on yt3.ggpht.com / i.ytimg.com
// that cause broken images when loading from localhost or a custom domain.

const YOUTUBE_CDN_DOMAINS = [
  "yt3.ggpht.com",
  "i.ytimg.com",
  "i9.ytimg.com",
  "lh3.googleusercontent.com",
];

/**
 * Returns a proxied URL for YouTube CDN images, or the original URL
 * if it's already a safe/local path.
 * @param {string} url  Original image URL from YouTube API
 * @returns {string}    Proxied URL via /api/image-proxy/
 */
export function proxyImage(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const isYouTubeCDN = YOUTUBE_CDN_DOMAINS.some((d) =>
      parsed.hostname.endsWith(d)
    );
    if (isYouTubeCDN) {
      return `/api/image-proxy/?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // Not a valid URL — return as-is
  }
  return url;
}
