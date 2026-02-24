require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testKey() {
    const key = process.env.GOOGLE_API_KEY;
    if (!key || key.includes("PLACEHOLDER")) {
        console.error("Error: No API key found in .env");
        return;
    }

    console.log("Testing API Key compatibility with Gemini...");
    const genAI = new GoogleGenerativeAI(key);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent("Hello, are you active?");
        const response = await result.response;
        console.log("SUCCESS: Gemini API is responding!");
        console.log("Response Preview:", response.text());
    } catch (error) {
        console.error("FAILURE: The provided key could not access Gemini API.");
        console.error("Reason:", error.message);
        console.log("\nTIP: Please check if 'Generative Language API' is enabled in your Google Cloud Console,");
        console.log("or create a dedicated key at https://aistudio.google.com/app/apikey");
    }
}

testKey();
