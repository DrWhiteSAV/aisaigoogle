import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API proxy endpoint for ProTalk
  app.post("/api/protalk", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const botId = process.env.PROTALK_BOT_ID || "64721";
      const botToken = process.env.PROTALK_BOT_TOKEN || "HVUBHByTSTAdl3qbKwVu0TWxCIAGC9rN";
      
      // Generate unique chat id
      const randomId = Math.floor(Math.random() * 900000) + 100000;
      const chat_id = `ask${randomId}`;

      console.log(`[Server ProTalk] Sending message to bot ${botId}, chat ${chat_id}`);

      // 1. Send the message asynchronously
      const sendResponse = await fetch("https://eu1.api.pro-talk.ru/api/v1.0/send_message_async", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bot_id: Number(botId),
          bot_token: botToken,
          bot_chat_id: chat_id,
          message: message
        })
      });

      if (!sendResponse.ok) {
        throw new Error(`Failed to send message to ProTalk: ${sendResponse.statusText}`);
      }

      await sendResponse.json();

      // 2. Poll for the reply with a timeout
      const TIMEOUT_MS = 60000; // 1 minute
      const POLL_INTERVAL_MS = 3000; // 3 seconds
      const startTime = Date.now();

      while (Date.now() - startTime < TIMEOUT_MS) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

        console.log(`[Server ProTalk] Polling for reply on chat_id ${chat_id}...`);
        const pollResponse = await fetch("https://eu1.api.pro-talk.ru/api/v1.0/get_last_reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            bot_id: Number(botId),
            bot_token: botToken,
            bot_chat_id: chat_id
          })
        });

        if (!pollResponse.ok) {
          console.warn(`[Server ProTalk] Polling error: ${pollResponse.statusText}`);
          continue;
        }

        const pollData = await pollResponse.json();
        if (pollData && pollData.message) {
          console.log("[Server ProTalk] Success! Message received");
          return res.json({ message: pollData.message });
        }
      }

      throw new Error("Timeout waiting for ProTalk response after 1 minute.");
    } catch (error: any) {
      console.error("[Server ProTalk] Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start Express/Vite server:", err);
});
