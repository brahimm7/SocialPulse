# YouTube Channel Analytics Dashboard

A full-stack web app built with **Django** (REST API) + **React + Tailwind** (frontend).
Uses the **YouTube Data API v3** — free, reliable, and no scraping issues.

---

## Project Structure

```
ytanalytics/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example          ← copy to .env, add your API key
│   ├── ytanalytics/
│   │   ├── settings.py
│   │   └── urls.py
│   └── api/
│       ├── views.py           ← REST endpoints
│       └── youtube_service.py ← API pipeline
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── pages/Home.jsx
        ├── components/
        │   ├── SearchBar.jsx
        │   ├── ChannelHeader.jsx
        │   ├── KpiCards.jsx
        │   ├── Charts.jsx
        │   └── VideoTable.jsx
        ├── hooks/useChannelData.js
        └── utils/format.js
```

---

## Setup

### 1. Get a Free YouTube API Key

1. Go to https://console.cloud.google.com/
2. Create a new project (or use existing)
3. **APIs & Services → Library → search "YouTube Data API v3" → Enable**
4. **Credentials → Create Credentials → API Key**
5. Copy the key

> Free quota: **10,000 units/day**. A full 50-video fetch costs ~5 units.

---

### 2. Backend (Django)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Open .env and set YOUTUBE_API_KEY=your_key_here

# Start Django server
python manage.py runserver
# → Running at http://localhost:8000
```

---

### 3. Frontend (React + Vite)

```bash
cd frontend

npm install
npm run dev
# → Running at http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/health/` | Health check + API key status |
| GET | `/api/channel/?url=<url>&max_videos=<n>` | Full channel analytics |

### Example Response Shape

```json
{
  "channel": {
    "title": "MrBeast",
    "subscriber_count": 280000000,
    "view_count": 50000000000,
    "video_count": 800
  },
  "videos": [
    {
      "id": "abc123",
      "title": "Video Title",
      "published_date": "2024-01-15",
      "view_count": 5000000,
      "like_count": 200000,
      "duration_sec": 720,
      "duration_fmt": "12:00",
      "video_type": "Long-form",
      "views_per_day": 12500.5,
      "watch_url": "https://www.youtube.com/watch?v=abc123"
    }
  ],
  "summary": {
    "total_videos_fetched": 50,
    "total_views": 250000000,
    "avg_views": 5000000,
    "shorts_count": 5,
    "medium_count": 10,
    "longform_count": 35
  }
}
```

---

## Supported URL Formats

```
https://www.youtube.com/@MrBeast
https://www.youtube.com/c/MrBeast6000
https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA
@MrBeast
UCX6OQ3DkcsbYNE6H8uQQuVA
```

---

## Dashboard Features

- **Channel overview**: avatar, subscribers, total views, creation date
- **KPI cards**: total views, avg views, avg likes, avg duration
- **Top 10 most viewed** horizontal bar chart
- **Views over time** line chart with rolling average
- **Duration histogram** bucketed by range
- **Content mix** pie chart (Short / Medium / Long-form)
- **Engagement velocity** scatter plot (views/day vs upload date)
- **Full video table** with search, sort, and pagination

