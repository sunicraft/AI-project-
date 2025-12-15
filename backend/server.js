// backend/server.js

import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

// ---------- PATH SETUP ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- ENV CHECK ----------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ FATAL ERROR: GEMINI_API_KEY is missing.");
  process.exit(1);
}

// ---------- APP INIT ----------
const app = express();
const PORT = process.env.PORT || 3000;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json());

// ---------- ROOT ----------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../sunicraft.html"));
});

// ---------- AI API ----------
app.post("/api/analyze-and-generate", async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  const prompt = `
You are an expert YouTube SEO tool called TITLEGAN AI.

Topic: "${topic}"

Generate EXACTLY:
- 5 click-worthy YouTube titles
- 5 long-tail keywords with competition score (10-100)
- 15 YouTube tags
- 1 SEO-rich description snippet (max 150 chars)

Respond ONLY in valid JSON:
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
      config: {
        responseMimeType: "application/json",
      },
    });

    // ---------- SAFE JSON CLEAN ----------
    let rawText = response.text.trim();

    // Remove ```json ``` wrappers if present
    rawText = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (jsonErr) {
      console.error("❌ JSON Parse Failed:", rawText);
      return res.status(500).json({ error: "Invalid AI JSON response" });
    }

    // ---------- HARD SAFETY FORMAT ----------
    const safeResponse = {
      titles: Array.isArray(parsed.titles) ? parsed.titles.slice(0, 5) : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 15) : [],
      description_snippet:
        typeof parsed.description_snippet === "string"
          ? parsed.description_snippet
          : "AI-generated SEO description not available.",
    };

    res.json(safeResponse);

  } catch (err) {
    console.error("🔥 AI ERROR:", err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`🚀 TITLEGAN AI Server running on PORT ${PORT}`);
});
