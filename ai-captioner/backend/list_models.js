require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    try {
        // The listModels method may not be directly available on genAI in all SDK versions,
        // but we can try to fetch it if the SDK supports it or use a default one.
        console.log("Listing available models...");
        // In @google/generative-ai, listing models is usually done via a different approach or not exposed directly.
        // Let's try gemini-1.5-flash-001 or gemini-1.5-flash-002
        const models = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro", "gemini-1.0-pro"];
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("test");
                console.log(`Model ${m}: SUCCESS`);
            } catch (e) {
                console.log(`Model ${m}: FAILED - ${e.message}`);
            }
        }
    } catch (e) {
        console.error("List models failed:", e);
    }
}
listModels();
