// server.js — tiny backend for Tammana's Kitchen
// Serves the frontend AND proxies calls to Gemini so the API key never
// touches the browser.

const express = require("express");
const path = require("path");

const app = express();
app.use(express.json({ limit: "12mb" })); // photos are base64, need more room

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";

if (!GEMINI_API_KEY) {
  console.warn(
    "⚠️  No GEMINI_API_KEY set. The app will run but 'Ask Pranay' will fail.\n" +
    "   Set it as an environment variable before starting the server."
  );
}

// Serve the frontend (index.html, css, etc) from /public
app.use(express.static(path.join(__dirname, "public")));

// Single proxy endpoint. The frontend sends a Gemini-format body
// ({ contents: [...], generationConfig: {...} }). We attach the real API
// key server-side (Gemini takes it as a URL query param) and forward it.
app.post("/api/gemini", async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reach Gemini." });
  }
});

app.listen(PORT, () => {
  console.log(`Tammana's Kitchen running on http://localhost:${PORT}`);
});
