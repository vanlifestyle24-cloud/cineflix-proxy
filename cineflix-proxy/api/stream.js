// api/stream.js - Cineflix High-Capacity Video Streamer (Supports >20MB Files)
export default async function handler(req, res) {
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "Missing fileId parameter" });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  // If no Telegram token, fall back to direct URL streaming for guests
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN missing in Environment" });
  }

  try {
    // 1. Try standard getFile first (Fastest for files under 20MB)
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
    const tgData = await tgRes.json();

    let directStreamUrl = null;

    if (tgData.ok && tgData.result?.file_path) {
      directStreamUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${tgData.result.file_path}`;
    } else {
      // 2. Fallback for Big Files (>20MB up to 2GB) via High-Speed Streaming Worker
      directStreamUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/videos/${fileId}.mp4`;
    }

    // Video scrubbing & range headers forward karna
    const headers = {};
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const videoStream = await fetch(directStreamUrl, { headers });

    res.setHeader("Content-Type", videoStream.headers.get("content-type") || "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");

    if (videoStream.headers.get("content-range")) {
      res.setHeader("Content-Range", videoStream.headers.get("content-range"));
      res.status(206);
    } else {
      res.status(200);
    }

    if (videoStream.headers.get("content-length")) {
      res.setHeader("Content-Length", videoStream.headers.get("content-length"));
    }

    const arrayBuffer = await videoStream.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("Stream Proxy Error:", error);
    return res.status(500).json({ error: "Proxy error", message: error.message });
  }
}
