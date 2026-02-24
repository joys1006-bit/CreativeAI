const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Generates a video script based on a topic.
 * @param {string} topic 
 * @returns {Promise<Array<{text: string, duration: number, visual: string}>>}
 */
async function generateScript(topic) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    You are a professional video script writer.
    Create a 1-minute YouTube Short video script about: "${topic}".
    The output MUST be a valid JSON array of objects.
    Each object representing a scene should have:
    - "text": The narration text (keep it punchy and short).
    - "duration": Estimated duration in seconds (integer).
    - "visual": A short description of the background visual (e.g., "Stock chart rising", "Money falling").

    Example format:
    [
        { "text": "Do you want to get rich?", "duration": 3, "visual": "Man holding cash" },
        { "text": "Listen to this.", "duration": 2, "visual": "Ear icon" }
    ]

    IMPORTANT: Return ONLY the JSON. No markdown formatting, no code blocks.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Cleanup potential markdown code blocks if Gemini mimics them
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const script = JSON.parse(text);
        return script;
    } catch (error) {
        console.error("Gemini Script Generation Error:", error);
        throw new Error("Failed to generate script");
    }
}

module.exports = { generateScript };
