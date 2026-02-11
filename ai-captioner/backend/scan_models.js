require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const key = process.env.GOOGLE_API_KEY;
    const genAI = new GoogleGenerativeAI(key);

    try {
        console.log("Fetching available models...");
        // SDK doesn't have a direct listModels method in some versions, 
        // using fetch as backup but let's try calling a known model first
        const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent("test");
                console.log(`MODEL OK: ${m}`);
            } catch (e) {
                console.log(`MODEL FAIL: ${m} - ${e.message}`);
            }
        }
    } catch (error) {
        console.error("Critical Error:", error.message);
    }
}

listModels();
