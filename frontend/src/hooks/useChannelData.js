// src/hooks/useChannelData.js
import { useState, useCallback } from "react";
import axios from "axios";

// Empty string = relative path (works locally via Vite proxy / Docker nginx)
// Set VITE_API_URL on Vercel to point to your Railway backend URL
const BASE = import.meta.env.VITE_API_URL || "";

export function useChannelData() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fetchChannel = useCallback(async (url, maxVideos = 50) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await axios.get(BASE + "/api/channel/", {
        params: { url, max_videos: maxVideos },
      });
      setData(res.data);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "An unexpected error occurred.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchChannel };
}
