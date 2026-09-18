const MASTER_API_KEY = "cineflix_live_master_98f4a21e7d0b3c65e8a11974ef";

// In-Memory Cloud Store (Jab tak aap Supabase ya Redis na lagayein)
let globalMovies = [];
let globalSettings = {
  maintenanceMode: false,
  announcementBanner: "🔥 Welcome to CINEFLIX Ultra 4K OTT Streaming!",
  showAnnouncement: true
};

export default async function handler(req, res) {
  // Enable CORS for Dashboard
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Verify Master API Key
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== MASTER_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Master API Key' });
  }

  // 2. Handle GET (Android App & Dashboard get all movies)
  if (req.method === 'GET') {
    return res.status(200).json({
      movies: globalMovies,
      settings: globalSettings,
      count: globalMovies.length
    });
  }

  // 3. Handle POST (Add/Update Movie or Settings)
  if (req.method === 'POST') {
    const { action, payload, settings } = req.body || {};

    if (action === 'publish_content' && payload) {
      // Nayi movie add ya update karna
      const existingIdx = globalMovies.findIndex(m => m.id === payload.id);
      if (existingIdx >= 0) {
        globalMovies[existingIdx] = payload;
      } else {
        globalMovies.unshift(payload);
      }
      return res.status(200).json({ success: true, message: 'Movie published successfully', item: payload });
    }

    if (action === 'update_settings' && settings) {
      globalSettings = { ...globalSettings, ...settings };
      return res.status(200).json({ success: true, settings: globalSettings });
    }

    if (action === 'delete_content') {
      const { contentId } = req.body;
      globalMovies = globalMovies.filter(m => m.id !== contentId);
      return res.status(200).json({ success: true, message: 'Movie deleted' });
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  // 4. Handle DELETE
  if (req.method === 'DELETE') {
    const contentId = req.query.id;
    globalMovies = globalMovies.filter(m => m.id !== contentId);
    return res.status(200).json({ success: true, message: 'Deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
