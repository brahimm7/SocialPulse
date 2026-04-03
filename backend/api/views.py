"""
api/views.py — REST endpoints for SocialPulse
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
    Proxies YouTube CDN images to bypass browser CORS restrictions.
    """
    import urllib.parse as urlparse
    import requests as req
    from django.http import HttpResponse

    img_url = request.query_params.get("url", "").strip()
    if not img_url:
        return Response({"error": "url parameter required"}, status=400)

    allowed = ("yt3.ggpht.com", "i.ytimg.com", "i9.ytimg.com", "lh3.googleusercontent.com")
    parsed  = urlparse.urlparse(img_url)
    if not any(parsed.netloc.endswith(d) for d in allowed):
        return Response({"error": "Domain not allowed"}, status=403)

    try:
        resp = req.get(img_url, timeout=8, headers={
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://www.youtube.com/",
        })
        resp.raise_for_status()
        http_resp = HttpResponse(resp.content, content_type=resp.headers.get("Content-Type", "image/jpeg"))
        http_resp["Cache-Control"] = "public, max-age=86400"
        http_resp["Access-Control-Allow-Origin"] = "*"
        return http_resp
    except Exception as exc:
        return Response({"error": str(exc)}, status=502)


@api_view(["GET"])
def search_channels(request):
    """
    GET /api/search-channels/?q=<query>
    Returns up to 5 channel suggestions. Cost: 100 quota units per call.
    Returns channel_id which is used directly for fetching — avoids
    the "channel not found" error when clicking suggestions.
    """
    import requests as req

    q = request.query_params.get("q", "").strip()
    if not q or not settings.YOUTUBE_API_KEY:
        return Response({"results": []})

    try:
        resp = req.get(
            f"{settings.YOUTUBE_API_BASE}/search",
            params={
                "part":       "snippet",
                "q":          q,
                "type":       "channel",
                "maxResults": 5,
                "key":        settings.YOUTUBE_API_KEY,
            },
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("items", []):
            snippet    = item.get("snippet", {})
            channel_id = item["id"].get("channelId", "")
            results.append({
                "channel_id":  channel_id,
                # Pass channel_id as the search URL — always works, never ambiguous
                "search_url":  channel_id,
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
    """
    GET /api/channel/?url=<channel_url_or_id>&max_videos=<n>
    max_videos=0 means fetch all videos.
    """
    url        = request.query_params.get("url", "").strip()
    max_videos = int(request.query_params.get("max_videos", 50))

    if not url:
        return Response(
            {"error": "Query parameter 'url' is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if max_videos < 0:
        return Response(
            {"error": "'max_videos' must be 0 (all) or a positive integer."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        data = get_channel_analytics(url, max_videos)
        return Response(data)
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        return Response(
            {"error": f"An unexpected error occurred: {str(exc)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )