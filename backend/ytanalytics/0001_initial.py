from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ChannelCache",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("channel_id",       models.CharField(db_index=True, max_length=64, unique=True)),
                ("title",            models.CharField(blank=True, max_length=255)),
                ("custom_url",       models.CharField(blank=True, max_length=128)),
                ("thumbnail_url",    models.URLField(blank=True)),
                ("subscriber_count", models.BigIntegerField(default=0)),
                ("view_count",       models.BigIntegerField(default=0)),
                ("video_count",      models.IntegerField(default=0)),
                ("description",      models.TextField(blank=True)),
                ("published_at",     models.DateTimeField(blank=True, null=True)),
                ("hidden_subscribers", models.BooleanField(default=False)),
                ("raw_data",         models.JSONField(default=dict)),
                ("fetched_at",       models.DateTimeField(default=django.utils.timezone.now)),
                ("created_at",       models.DateTimeField(auto_now_add=True)),
                ("updated_at",       models.DateTimeField(auto_now=True)),
            ],
            options={"db_table": "channel_cache"},
        ),
        migrations.CreateModel(
            name="VideoCache",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("channel", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,
                    related_name="videos", to="api.channelcache")),
                ("video_id",      models.CharField(db_index=True, max_length=32)),
                ("title",         models.CharField(blank=True, max_length=512)),
                ("published_date",models.DateField(blank=True, db_index=True, null=True)),
                ("view_count",    models.BigIntegerField(db_index=True, default=0)),
                ("like_count",    models.BigIntegerField(default=0)),
                ("comment_count", models.BigIntegerField(default=0)),
                ("duration_sec",  models.IntegerField(default=0)),
                ("video_type",    models.CharField(blank=True, max_length=32)),
                ("raw_data",      models.JSONField(default=dict)),
                ("fetched_at",    models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={"db_table": "video_cache", "ordering": ["-published_date"]},
        ),
        migrations.AddIndex(
            model_name="videocache",
            index=models.Index(fields=["channel", "published_date"], name="video_cache_channel_date_idx"),
        ),
        migrations.AddIndex(
            model_name="videocache",
            index=models.Index(fields=["channel", "view_count"], name="video_cache_channel_views_idx"),
        ),
        migrations.AlterUniqueTogether(
            name="videocache",
            unique_together={("channel", "video_id")},
        ),
    ]
