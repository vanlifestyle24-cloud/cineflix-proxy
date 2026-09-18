// api/stream.js
export default async function handler(req, res) {
  const { fileId } = req.query;

  if (!fileId) {
    return res.status(400).json({ error: "Missing fileId parameter" });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN missing in Environment" });
  }

  try {
    // 1. Telegram API se file_path mangwana
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
    const tgData = await tgRes.json();

    if (!tgData.ok || !tgData.result.file_path) {
      return res.status(404).json({ error: "Telegram file not found", details: tgData });
    }

    const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${tgData.result.file_path}`;

    // 2. Video Scrubbing (Range Requests) forward karna taaki player aage-peeche fast chale
    const headers = {};
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const videoStream = await fetch(downloadUrl, { headers });

    // 3. High-concurrency Edge Caching headers lagana
    res.setHeader("Content-Type", videoStream.headers.get("content-type") || "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200");

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