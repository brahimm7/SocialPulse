"""
api/views.py
────────────
REST API endpoints consumed by the React frontend.

GET /api/channel/?url=<channel_url>&max_videos=<n>
  → Full channel analytics JSON

GET /api/health/
  → { "status": "ok", "api_key_set": true/false }
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from .youtube_service import get_channel_analytics


@api_view(["GET"])
def health(request):
    return Response({
        "status": "ok",
        "api_key_set": bool(settings.YOUTUBE_API_KEY),
    })


@api_view(["GET"])
def image_proxy(request):
    """
    GET /api/image-proxy/?url=<encoded_url>

    Proxies YouTube thumbnail images through Django to bypass browser
    CORS restrictions on yt3.ggpht.com and i.ytimg.com domains.
    Only allows YouTube image domains for security.
    """
    import urllib.parse as urlparse

    img_url = request.query_params.get("url", "").strip()
    if not img_url:
        return Response({"error": "url parameter required"}, status=400)

    # Security: only proxy from known YouTube image CDNs
    allowed = ("yt3.ggpht.com", "i.ytimg.com", "i9.ytimg.com", "lh3.googleusercontent.com")
    parsed  = urlparse.urlparse(img_url)
    if not any(parsed.netloc.endswith(d) for d in allowed):
        return Response({"error": "Domain not allowed"}, status=403)

    try:
        import requests as req
        from django.http import HttpResponse

        resp = req.get(img_url, timeout=8, headers={
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://www.youtube.com/",
        })
        resp.raise_for_status()
        content_type = resp.headers.get("Content-Type", "image/jpeg")
        http_resp = HttpResponse(resp.content, content_type=content_type)
        http_resp["Cache-Control"] = "public, max-age=86400"
        http_resp["Access-Control-Allow-Origin"] = "*"
        return http_resp

    except Exception as exc:
        return Response({"error": str(exc)}, status=502)
@api_view(["GET"])
def search_channels(request):


    """
    GET /api/search-channels/?q=<query>
    Returns up to 5 channel suggestions using YouTube Search API.
    Cost: 100 quota units per call (debounced on the frontend to 600ms).
    """
    q = request.query_params.get("q", "").strip()
    if not q:
        return Response({"results": []})

    if not settings.YOUTUBE_API_KEY:
        return Response({"results": []})

    try:
        import requests as req
        params = {
            "part": "snippet",
            "q": q,
            "type": "channel",
            "maxResults": 5,
            "key": settings.YOUTUBE_API_KEY,
        }
        resp = req.get(f"{settings.YOUTUBE_API_BASE}/search", params=params, timeout=8)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            results.append({
                "channel_id":  item["id"].get("channelId", ""),
                "title":       snippet.get("title", ""),
                "thumbnail":   snippet.get("thumbnails", {}).get("default", {}).get("url", ""),
                "custom_url":  snippet.get("customUrl", ""),
                "description": snippet.get("description", "")[:120],
            })

        return Response({"results": results})

    except Exception:
        return Response({"results": []})


@api_view(["GET"])
def channel_analytics(request):
    url        = request.query_params.get("url", "").strip()
    max_videos = int(request.query_params.get("max_videos", 50))

    if not url:
        return Response(
            {"error": "Query parameter 'url' is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # max_videos=0 is the sentinel for "fetch all videos"
    if max_videos < 0:
        return Response(
            {"error": "'max_videos' must be 0 (all) or a positive integer."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        data = get_channel_analytics(url, max_videos)
        return Response(data)

    except ValueError as exc:
        return Response(
            {"error": str(exc)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as exc:
        # Log full error in production
        return Response(
            {"error": f"An unexpected error occurred: {str(exc)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
