const { GoogleGenerativeAI } = require("@google/generative-ai");
const key = "AIzaSyAfdyy0CkQ0lbvSj3VQYinUZvn41ztjb_w";
console.log("Testing with hardcoded key length:", key.length);

const genAI = new GoogleGenerativeAI(key);

async function run() {
    try {
        console.log("Accessing model...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Generating content...");
        const result = await model.generateContent("Hello, respond with 'OK' if you see this.");
        const response = await result.response;
        console.log("RESULT:", response.text());
        console.log("SUCCESS: Key is working!");
    } catch (e) {
        console.error("FAILURE:", e.message);
    }
}
run();
