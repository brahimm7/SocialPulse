"""
api/youtube_service.py
───────────────────────
YouTube Data API v3 service layer with PostgreSQL (Supabase) persistence.

Cache strategy:
  1. Check DB for a fresh ChannelCache row (< ANALYTICS_CACHE_TTL seconds old)
  2. If fresh → reconstruct response from DB rows (zero API calls)
  3. If stale / missing → call YouTube API, upsert DB rows, return data

Quota cost (only on cache miss):
  channels.list × 2  + playlistItems.list × pages  + videos.list × batches
  ≈ 4–6 units for 50 videos  (10,000 free units/day)
"""

import datetime
import re

import requests as req
from django.conf import settings
from django.utils import timezone


BASE = settings.YOUTUBE_API_BASE
TTL  = settings.ANALYTICS_CACHE_TTL


# ── Low-level HTTP helper ─────────────────────────────────────────────────────

def _get(endpoint: str, params: dict) -> dict:
    params["key"] = settings.YOUTUBE_API_KEY
    resp = req.get(f"{BASE}/{endpoint}", params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()


def _parse_iso8601_duration(s: str) -> int:
    if not s:
        return 0
    m = re.fullmatch(r"P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", s or "")
    if not m:
        return 0
    days, hours, mins, secs = (int(v or 0) for v in m.groups())
    return days * 86400 + hours * 3600 + mins * 60 + secs


def _fmt_duration(sec: int) -> str:
    if sec <= 0:
        return "—"
    h, r = divmod(sec, 3600)
    m, s = divmod(r, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


# ── Step 1: resolve channel URL → channel_id ─────────────────────────────────

def resolve_channel_id(query: str) -> str:
    query = query.strip().rstrip("/")
    if re.match(r"^UC[\w-]{21,}$", query):
        return query
    m = re.search(r"/channel/(UC[\w-]{21,})", query)
    if m:
        return m.group(1)
    handle_match = re.search(r"@([\w.-]+)", query)
    handle = handle_match.group(1) if handle_match else query.lstrip("@")
    data  = _get("channels", {"part": "id", "forHandle": handle, "maxResults": 1})
    items = data.get("items", [])
    if not items:
        raise ValueError(f"Could not find channel '@{handle}'. Check the URL or handle.")
    return items[0]["id"]


# ── Step 2: fetch channel info from YouTube ───────────────────────────────────

def fetch_channel_info(channel_id: str) -> dict:
    data  = _get("channels", {"part": "snippet,statistics,brandingSettings", "id": channel_id})
    items = data.get("items", [])
    if not items:
        raise ValueError(f"No channel found for ID: {channel_id}")
    item    = items[0]
    snippet = item.get("snippet", {})
    stats   = item.get("statistics", {})
    return {
        "channel_id":         channel_id,
        "title":              snippet.get("title", ""),
        "description":        snippet.get("description", "")[:400],
        "custom_url":         snippet.get("customUrl", ""),
        "published_at":       snippet.get("publishedAt", ""),
        "thumbnail":          (
            snippet.get("thumbnails", {}).get("high", {}).get("url") or
            snippet.get("thumbnails", {}).get("medium", {}).get("url") or
            snippet.get("thumbnails", {}).get("default", {}).get("url") or ""
        ),
        "subscriber_count":   int(stats.get("subscriberCount", 0)),
        "view_count":         int(stats.get("viewCount", 0)),
        "video_count":        int(stats.get("videoCount", 0)),
        "hidden_subscribers": stats.get("hiddenSubscriberCount", False),
    }


# ── Step 3: get uploads playlist ID ──────────────────────────────────────────

def get_uploads_playlist_id(channel_id: str) -> str:
    return "UU" + channel_id[2:]


# ── Step 4: collect video IDs ─────────────────────────────────────────────────

def fetch_video_ids(playlist_id: str, max_videos: int = 50) -> list:
    fetch_all = (max_videos == 0)
    ids, next_page = [], None
    while True:
        page_size = 50 if fetch_all else min(50, max_videos - len(ids))
        if not fetch_all and page_size <= 0:
            break
        params = {"part": "contentDetails", "playlistId": playlist_id, "maxResults": page_size}
        if next_page:
            params["pageToken"] = next_page
        data = _get("playlistItems", params)
        for item in data.get("items", []):
            vid_id = item["contentDetails"].get("videoId")
            if vid_id:
                ids.append(vid_id)
        next_page = data.get("nextPageToken")
        if not next_page:
            break
    return ids


# ── Step 5: batch-fetch video details ────────────────────────────────────────

def fetch_videos_details(video_ids: list) -> list:
    videos = []
    today  = datetime.date.today()
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i: i + 50]
        data  = _get("videos", {"part": "snippet,statistics,contentDetails", "id": ",".join(batch), "maxResults": 50})
        for item in data.get("items", []):
            snippet  = item.get("snippet", {})
            stats    = item.get("statistics", {})
            content  = item.get("contentDetails", {})
            pub_raw  = snippet.get("publishedAt", "")
            pub_date = None
            if pub_raw:
                try:
                    pub_date = datetime.datetime.fromisoformat(pub_raw.replace("Z", "+00:00")).date()
                except Exception:
                    pass
            duration_sec  = _parse_iso8601_duration(content.get("duration", ""))
            view_count    = int(stats.get("viewCount",    0))
            like_count    = int(stats.get("likeCount",    0))
            comment_count = int(stats.get("commentCount", 0))
            days = max((today - pub_date).days, 1) if pub_date else 1
            video_type = ("Short" if duration_sec <= 60
                          else "Medium" if duration_sec <= 600
                          else "Long-form")
            videos.append({
                "id":             item["id"],
                "title":          snippet.get("title", ""),
                "published_at":   pub_raw,
                "published_date": pub_date.isoformat() if pub_date else None,
                "thumbnail":      snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                "duration_sec":   duration_sec,
                "duration_fmt":   _fmt_duration(duration_sec),
                "video_type":     video_type,
                "view_count":     view_count,
                "like_count":     like_count,
                "comment_count":  comment_count,
                "views_per_day":  round(view_count / days, 1),
                "days_since_upload": days,
                "watch_url":      f"https://www.youtube.com/watch?v={item['id']}",
            })
    return videos


# ── DB cache helpers ──────────────────────────────────────────────────────────

def _build_summary(videos: list) -> dict:
    view_counts = [v["view_count"] for v in videos]
    return {
        "total_videos_fetched": len(videos),
        "total_views":          sum(view_counts),
        "avg_views":            round(sum(view_counts) / len(view_counts)) if view_counts else 0,
        "max_views":            max(view_counts) if view_counts else 0,
        "avg_likes":            round(sum(v["like_count"] for v in videos) / len(videos)) if videos else 0,
        "avg_duration_sec":     round(sum(v["duration_sec"] for v in videos) / len(videos)) if videos else 0,
        "shorts_count":         sum(1 for v in videos if v["video_type"] == "Short"),
        "medium_count":         sum(1 for v in videos if v["video_type"] == "Medium"),
        "longform_count":       sum(1 for v in videos if v["video_type"] == "Long-form"),
    }


def _save_to_db(channel_info: dict, videos: list) -> None:
    """Upsert channel + videos into PostgreSQL."""
    try:
        from .models import ChannelCache, VideoCache
        import datetime as dt

        pub_at = None
        if channel_info.get("published_at"):
            try:
                pub_at = datetime.datetime.fromisoformat(
                    channel_info["published_at"].replace("Z", "+00:00")
                )
            except Exception:
                pass

        channel_obj, _ = ChannelCache.objects.update_or_create(
            channel_id=channel_info["channel_id"],
            defaults={
                "title":             channel_info["title"],
                "custom_url":        channel_info.get("custom_url", ""),
                "thumbnail_url":     channel_info.get("thumbnail", ""),
                "subscriber_count":  channel_info.get("subscriber_count", 0),
                "view_count":        channel_info.get("view_count", 0),
                "video_count":       channel_info.get("video_count", 0),
                "description":       channel_info.get("description", ""),
                "published_at":      pub_at,
                "hidden_subscribers":channel_info.get("hidden_subscribers", False),
                "raw_data":          channel_info,
                "fetched_at":        timezone.now(),
            },
        )

        # Bulk upsert videos
        for v in videos:
            pub_date = None
            if v.get("published_date"):
                try:
                    pub_date = dt.date.fromisoformat(v["published_date"])
                except Exception:
                    pass

            VideoCache.objects.update_or_create(
                channel=channel_obj,
                video_id=v["id"],
                defaults={
                    "title":          v["title"],
                    "published_date": pub_date,
                    "view_count":     v["view_count"],
                    "like_count":     v["like_count"],
                    "comment_count":  v["comment_count"],
                    "duration_sec":   v["duration_sec"],
                    "video_type":     v["video_type"],
                    "raw_data":       v,
                    "fetched_at":     timezone.now(),
                },
            )
    except Exception:
        pass  # DB write failure must never crash the API response


def _load_from_db(channel_id: str, max_videos: int) -> dict | None:
    """
    Try to load fresh data from PostgreSQL.
    Returns None if cache is stale, missing, or DB is unavailable.
    """
    try:
        from .models import ChannelCache
        ch = ChannelCache.objects.filter(channel_id=channel_id).first()
        if not ch or ch.is_stale(TTL):
            return None
        qs = ch.videos.order_by("-published_date")
        if max_videos > 0:
            qs = qs[:max_videos]
        videos = [v.raw_data for v in qs]
        if not videos:
            return None
        return {
            "channel": ch.raw_data,
            "videos":  videos,
            "summary": _build_summary(videos),
        }
    except Exception:
        return None  # DB unavailable — fall through to live API call


# ── Public entry point ────────────────────────────────────────────────────────

def get_channel_analytics(channel_url: str, max_videos: int = 50) -> dict:
    """
    Full analytics pipeline.
    1. Resolve channel URL → channel_id
    2. Check PostgreSQL cache (fresh = < TTL seconds old)
    3. On cache miss: call YouTube API → save to DB → return
    """
    if not settings.YOUTUBE_API_KEY:
        raise ValueError(
            "YOUTUBE_API_KEY is not set. Add it to your .env file."
        )

    channel_id = resolve_channel_id(channel_url)

    # Try DB cache first
    cached = _load_from_db(channel_id, max_videos)
    if cached:
        return cached

    # Live YouTube API fetch
    channel_info = fetch_channel_info(channel_id)
    playlist_id  = get_uploads_playlist_id(channel_id)
    video_ids    = fetch_video_ids(playlist_id, max_videos)
    videos       = fetch_videos_details(video_ids)

    # Persist to DB (non-blocking best-effort)
    _save_to_db(channel_info, videos)

    return {
        "channel": channel_info,
        "videos":  videos,
        "summary": _build_summary(videos),
    }
