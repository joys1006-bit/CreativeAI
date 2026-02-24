const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listAllModels() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    try {
        const models = await genAI.listModels();
        console.log("=== Available Models ===");
        models.models.forEach(m => {
            console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
        });
        console.log("========================");
    } catch (e) {
        console.error("Failed to list models:", e);
    }
}

listAllModels();
