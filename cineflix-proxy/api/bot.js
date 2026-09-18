// api/bot.js - Cineflix Auto Stream & File ID Bot
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Cineflix Bot Webhook is Running Active 🚀");
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not configured" });
  }

  try {
    const update = req.body;
    const message = update.message || update.channel_post;

    if (!message) {
      return res.status(200).send("OK - No Message");
    }

    const chatId = message.chat.id;
    const media = message.video || message.document;

    // Agar message video ya document file hai
    if (media && media.file_id) {
      const fileId = media.file_id;
      const sizeMB = (media.file_size / (1024 * 1024)).toFixed(2);
      
      let durationStr = "N/A";
      if (media.duration) {
        const mins = Math.floor(media.duration / 60);
        const secs = media.duration % 60;
        durationStr = `${mins}m ${secs}s`;
      }

      const streamUrl = `https://cineflix-proxy.vercel.app/api/stream?fileId=${fileId}`;

      const replyText = 
`🎬 *CINEFLIX VIDEO PROCESSED!*

🆔 *Telegram File ID (Tap to Copy):*
\`${fileId}\`

🔗 *Stream URL:*
\`${streamUrl}\`

⏱ *Duration:* ${durationStr} | 💾 *Size:* ${sizeMB} MB

_Paste the File ID into your OTT Dashboard to publish instantly!_`;

      // Telegram par reply bhejna
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          parse_mode: "Markdown",
          reply_to_message_id: message.message_id
        })
      });
    } else if (message.text && message.text.startsWith("/start")) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "👋 Welcome to *Cineflix Stream Bot*!\n\nJust send or forward any video here, and I will instantly generate the **File ID** and **Streaming URL** for you! 🍿",
          parse_mode: "Markdown"
        })
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Bot Webhook Error:", error);
    return res.status(200).json({ ok: false, error: error.message });
  }
}
