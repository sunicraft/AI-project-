import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(cors());
app.use(express.json());

// ✅ SERVE HTML PROPERLY
app.use(express.static(path.join(__dirname, "../public")));

// ✅ ROOT PAGE
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ✅ AI API
app.post("/api/analyze-and-generate", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic required" });

    const prompt = `
Generate:
- 5 titles
- 5 keywords with score
- 15 tags
- 1 description snippet (max 150 chars)

Return JSON only.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    res.json(JSON.parse(response.text));
  } catch (e) {
    res.status(500).json({ error: "AI failed" });
  }
});

app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});
