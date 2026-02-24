const fs = require('fs');

async function testFinal() {
    const key = process.env.GOOGLE_API_KEY;
    // v1 endpoint
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;

    console.log("=== Testing with v1 Endpoint ===");

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Hello, answer with 'API_WORKING' if you see this." }]
                }]
            })
        });

        const data = await res.json();
        console.log("Response Status:", res.status);
        if (data.candidates) {
            console.log("SUCCESS! Model Response:", data.candidates[0].content.parts[0].text);
        } else {
            console.log("FAILURE Details:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}

testFinal();
