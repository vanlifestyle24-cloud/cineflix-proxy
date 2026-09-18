export default function handler(req, res) {
  // CORS Headers allow karein taaki Dashboard se connect ho sake
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-api-key, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    status: 'online',
    service: 'Cineflix Edge Proxy & Admin Core',
    timestamp: new Date().toISOString()
  });
}
