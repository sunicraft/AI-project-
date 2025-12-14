// backend/server.js

import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

// ----------- PATH SETUP -----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------- ENV CHECK -----------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ FATAL ERROR: GEMINI_API_KEY is not set.");
  process.exit(1);
}

// ----------- APP INIT -----------
const app = express();
const PORT = process.env.PORT || 3000;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ----------- MIDDLEWARE -----------
app.use(cors());
app.use(express.json());

// ----------- ROOT ROUTE (IMPORTANT) -----------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../sunicraft.html"));
});

// ----------- AI API ROUTE -----------
app.post("/api/analyze-and-generate", async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  const prompt = `
You are an expert YouTube SEO and content creation tool called TITLEGAN AI.

Topic: "${topic}"

Generate exactly:
- 5 click-worthy titles
- 5 long-tail keywords with competition score (10–100)
- 15 YouTube tags
- 1 SEO-rich description snippet (max 150 chars)

Return ONLY valid JSON in this format:
{
  "titles": [],
  "keywords": [{"keyword": "", "score": 0}],
  "tags": [],
  "description_snippet": ""
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const result = JSON.parse(response.text.trim());
    res.json(result);

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// ----------- START SERVER -----------
app.listen(PORT, () => {
  console.log(`🚀 AI Server is LIVE on PORT ${PORT}`);
});
