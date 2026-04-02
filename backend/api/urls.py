from django.urls import path
from . import views

urlpatterns = [
    path("health/",          views.health,             name="health"),
    path("image-proxy/",     views.image_proxy,        name="image_proxy"),
    path("search-channels/", views.search_channels,    name="search_channels"),
    path("channel/",         views.channel_analytics,  name="channel_analytics"),
]
