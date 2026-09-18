const MASTER_API_KEY = "cineflix_live_master_98f4a21e7d0b3c65e8a11974ef";

// In-Memory Cloud Store + Local Fallback for persistence across cold starts
let globalMovies = [];
let globalSettings = {
  maintenanceMode: false,
  announcementBanner: "🔥 Welcome to CINEFLIX Ultra 4K OTT Streaming!",
  showAnnouncement: true
};

// Fallback local storage file for cold restart persistence
const FALLBACK_FILE = '/tmp/cineflix_storage.json';
const fs = require('fs');

// Load saved data on cold start
function loadPersistedData() {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'));
      if (data.movies && data.movies.length > 0) {
        globalMovies = data.movies;
      }
      if (data.settings) {
        globalSettings = { ...globalSettings, ...data.settings };
      }
      console.log('✅ Loaded persisted data from local storage');
    }
  } catch (e) {
    console.error('Error loading persisted data:', e);
  }
}

// Save data to local file
function savePersistedData() {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify({ movies: globalMovies, settings: globalSettings }));
  } catch (e) {
    console.error('Error saving persisted data:', e);
  }
}

// Initialize: load persisted data on cold start
loadPersistedData();

// Seed default movies if none exist (for guest access)
if (globalMovies.length === 0) {
  globalMovies = [
    {
      id: "cf-137878",
      title: "Student of the Year",
      tagline: "Several alumni reminisce about their final year at St. Theresa's College and the events that shaped their lives.",
      genre: "Comedy, Romance, Drama",
      releaseYear: 2012,
      duration: "2h 26m",
      imdbRating: 5.3,
      matchScore: 88,
      posterUrl: "https://m.media-amazon.com/images/M/MV5BZjMxY2M4YWQtMGU1OS00NDNmLTgyZTctY2ExZmMyOGE1ZTcxXkEyXkFqcGc@._V1_SX300.jpg",
      backdropUrl: "https://m.media-amazon.com/images/M/MV5BZjMxY2M4YWQtMGU1OS00NDNmLTgyZTctY2ExZmMyOGE1ZTcxXkEyXkFqcGc@._V1_SX300.jpg",
      telegramFileId: "BAACAgQAAyEFAAMBCvw8ngADA2qs-639KpF1qX1KVxVTPxzQI1o9AAIMJgAC4-9oUXwOqMmJSL95PQQ",
      videoStreamUrl: "https://cineflix-proxy.vercel.app/api/stream?fileId=BAACAgQAAyEFAAMBCvw8ngADA2qs-639KpF1qX1KVxVTPxzQI1o9AAIMJgAC4-9oUXwOqMmJSL95PQQ",
      qualityBadges: ["4K UHD", "Dolby Atmos", "5.1", "Telegram Stream"],
      platformBadge: "TELEGRAM LIVE"
    },
    {
      id: "cf-neagley",
      title: "Neagley [Hindi]",
      tagline: "FROM THE WORLD OF REACHER",
      genre: "Action, Crime, Thriller",
      releaseYear: 2026,
      duration: "48m",
      imdbRating: 8.2,
      matchScore: 95,
      posterUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
      videoStreamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      qualityBadges: ["4K UHD", "HDR10+", "Dolby Atmos"],
      platformBadge: "CINEFLIX ORIGINAL"
    },
    {
      id: "cf-irumudi",
      title: "Irumudi [Hindi]",
      tagline: "A Sacred Journey of Vengeance",
      genre: "Action, Drama",
      releaseYear: 2026,
      duration: "2h 14m",
      imdbRating: 7.8,
      matchScore: 92,
      posterUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
      backdropUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
      videoStreamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      qualityBadges: ["4K UHD", "Dolby Vision"],
      platformBadge: "PRIME EXCLUSIVE"
    }
  ];
  savePersistedData();
}

export default async function handler(req, res) {
  // Enable CORS for Dashboard
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Verify Master API Key (optional for guest access, required for admin actions)
  const apiKey = req.headers['x-api-key'];
  const isAdmin = apiKey === MASTER_API_KEY;

  // Allow GET requests without auth (for video streaming and viewing content)
  if (req.method === 'GET' && !isAdmin) {
    // Guest access - return movies with limited data
    return res.status(200).json({
      movies: globalMovies.map(m => ({
        id: m.id,
        title: m.title,
        tagline: m.tagline,
        genre: m.genre,
        releaseYear: m.releaseYear,
        duration: m.duration,
        imdbRating: m.imdbRating,
        posterUrl: m.posterUrl,
        backdropUrl: m.backdropUrl,
        videoStreamUrl: m.videoStreamUrl,
        telegramFileId: m.telegramFileId,
        // Limited data for guests
        qualityBadges: m.qualityBadges,
        platformBadge: m.platformBadge
      })),
      settings: { maintenanceMode: globalSettings.maintenanceMode },
      count: globalMovies.length,
      guest: true
    });
  }

  // 2. Handle GET (Android App & Dashboard get all movies) - Full data for admin
  if (req.method === 'GET') {
    return res.status(200).json({
      movies: globalMovies,
      settings: globalSettings,
      count: globalMovies.length
    });
  }

  // 3. Handle POST (Add/Update Movie or Settings) - Requires Admin Auth
  if (req.method === 'POST') {
    if (!isAdmin) {
      return res.status(401).json({ error: 'Unauthorized: Admin API Key required for write operations' });
    }

    const { action, payload, settings } = req.body || {};

    if (action === 'publish_content' && payload) {
      // Nayi movie add ya update karna
      const existingIdx = globalMovies.findIndex(m => m.id === payload.id);
      if (existingIdx >= 0) {
        globalMovies[existingIdx] = payload;
      } else {
        globalMovies.unshift(payload);
      }
      savePersistedData();
      return res.status(200).json({ success: true, message: 'Movie published successfully', item: payload });
    }

    if (action === 'update_settings' && settings) {
      globalSettings = { ...globalSettings, ...settings };
      savePersistedData();
      return res.status(200).json({ success: true, settings: globalSettings });
    }

    if (action === 'delete_content') {
      const { contentId } = req.body;
      globalMovies = globalMovies.filter(m => m.id !== contentId);
      savePersistedData();
      return res.status(200).json({ success: true, message: 'Movie deleted' });
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  // 4. Handle DELETE - Requires Admin Auth
  if (req.method === 'DELETE') {
    if (!isAdmin) {
      return res.status(401).json({ error: 'Unauthorized: Admin API Key required for delete operations' });
    }

    const contentId = req.query.id;
    globalMovies = globalMovies.filter(m => m.id !== contentId);
    savePersistedData();
    return res.status(200).json({ success: true, message: 'Deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
