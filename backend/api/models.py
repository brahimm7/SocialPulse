"""
api/models.py
─────────────
PostgreSQL models for caching YouTube analytics data.

Why persist instead of just memory-cache?
  - Survive server restarts
  - Share cache across multiple workers / dynos
  - Query historical data (compare channel growth over time)
  - JSONB lets us store flexible video metadata without rigid schema changes

Schema overview:
  ChannelCache   → one row per channel, stores channel-level info + last fetch time
  VideoCache     → one row per video, JSONB payload for all metadata fields
"""

from django.db import models
from django.utils import timezone


class ChannelCache(models.Model):
    """Stores channel-level metadata. Keyed by YouTube channel_id."""

    channel_id      = models.CharField(max_length=64, unique=True, db_index=True)
    title           = models.CharField(max_length=255, blank=True)
    custom_url      = models.CharField(max_length=128, blank=True)
    thumbnail_url   = models.URLField(blank=True)
    subscriber_count= models.BigIntegerField(default=0)
    view_count      = models.BigIntegerField(default=0)
    video_count     = models.IntegerField(default=0)
    description     = models.TextField(blank=True)
    published_at    = models.DateTimeField(null=True, blank=True)
    hidden_subscribers = models.BooleanField(default=False)

    # Full raw payload (for forward-compat with new fields)
    raw_data        = models.JSONField(default=dict)

    fetched_at      = models.DateTimeField(default=timezone.now)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "channel_cache"
        verbose_name = "Channel Cache"

    def __str__(self):
        return f"{self.title} ({self.channel_id})"

    def is_stale(self, ttl_seconds=3600):
        """Returns True if this cache entry is older than ttl_seconds."""
        age = (timezone.now() - self.fetched_at).total_seconds()
        return age > ttl_seconds


class VideoCache(models.Model):
    """
    Stores per-video metadata. Linked to ChannelCache.
    Uses JSONB (via JSONField) for flexible metadata storage.
    """

    channel         = models.ForeignKey(
        ChannelCache, on_delete=models.CASCADE, related_name="videos"
    )
    video_id        = models.CharField(max_length=32, db_index=True)

    # Core indexed fields (for fast filtering/sorting)
    title           = models.CharField(max_length=512, blank=True)
    published_date  = models.DateField(null=True, blank=True, db_index=True)
    view_count      = models.BigIntegerField(default=0, db_index=True)
    like_count      = models.BigIntegerField(default=0)
    comment_count   = models.BigIntegerField(default=0)
    duration_sec    = models.IntegerField(default=0)
    video_type      = models.CharField(max_length=32, blank=True)  # Short/Medium/Long-form

    # Full payload (thumbnail, views_per_day, duration_fmt, watch_url, etc.)
    raw_data        = models.JSONField(default=dict)

    fetched_at      = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "video_cache"
        unique_together = [("channel", "video_id")]
        ordering = ["-published_date"]
        indexes = [
            models.Index(fields=["channel", "published_date"]),
            models.Index(fields=["channel", "view_count"]),
        ]

    def __str__(self):
        return f"{self.title[:60]} ({self.video_id})"
