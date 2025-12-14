// Termux/Node.js Server Code: server.js

import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai'; 
import 'dotenv/config'; 

// **********************************************
// ** Render पर यह Key Environment Variables से आएगी **
// **********************************************
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

if (!GEMINI_API_KEY) {
    // यह Render पर या Termux में बिना .env के चलने पर Error देगा
    console.error("FATAL ERROR: GEMINI_API_KEY is not set.");
    console.error("Please set it as an Environment Variable in Render or create a .env file locally.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const app = express();
const PORT = process.env.PORT || 3000; // Render स्वचालित रूप से PORT सेट करता है

// Middleware
app.use(cors()); // CORS सक्षम है
app.use(express.json()); // JSON body पार्स करने के लिए

// मुख्य AI एनालिसिस रूट
app.post('/api/analyze-and-generate', async (req, res) => {
    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ error: 'Topic is required.' });
    }

    console.log(`[REQUEST] Processing topic: "${topic}"`);

    const prompt = `
        You are an expert YouTube SEO and content creation tool called TITLEGAN AI.
        Your task is to analyze the given topic and generate high-performing, click-bait yet high-quality titles, keywords, and video tags.

        Topic: "${topic}"

        Generate exactly 5 highly compelling, unique, and click-worthy titles.
        Generate 5 top long-tail keywords relevant to the topic. For each keyword, assign a competition score from 10 to 100 (100 being the highest competition).
        Generate 15 relevant YouTube video tags (single words or short phrases).
        Generate one compelling, SEO-rich description snippet (max 150 characters) that acts as the first line of the video description.

        Output the result ONLY as a single JSON object.

        JSON Structure:
        {
          "titles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
          "keywords": [
            {"keyword": "long tail keyword 1", "score": 85},
            // ... more keywords
          ],
          "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13", "tag14", "tag15"],
          "description_snippet": "Your SEO-rich description snippet goes here."
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        
        const jsonText = response.text.trim();
        const aiResult = JSON.parse(jsonText);

        res.json(aiResult);

    } catch (error) {
        console.error("[ERROR] AI Generation Failed:", error);
        res.status(500).json({ 
            error: 'Failed to generate content from AI. Check server logs for details.', 
            details: error.message 
        });
    }
});

// सर्वर को चालू करें
app.listen(PORT, () => {
    console.log(`** AI Server is RUNNING on PORT ${PORT} **`);
});
