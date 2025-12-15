import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/analyze-and-generate", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
Return ONLY valid JSON. No text. No explanation.

{
  "titles": ["title 1", "title 2", "title 3", "title 4", "title 5"],
  "keywords": [
    { "keyword": "keyword1", "score": 90 },
    { "keyword": "keyword2", "score": 85 }
  ],
  "tags": ["tag1", "tag2", "tag3"],
  "description_snippet": "short SEO description"
}

Topic: ${topic}
`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("❌ Gemini RAW:", raw);
      return res.status(500).json({ error: "AI response invalid" });
    }

    return res.json(data);

  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ error: "Server failed" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});
