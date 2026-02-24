async function checkModels() {
    const key = process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("=== Gemini Models List ===");
        if (data.models) {
            data.models.forEach(m => {
                console.log(`- ${m.name}`);
            });
        } else {
            console.log("No models found or error:", data);
        }
        console.log("==========================");
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

checkModels();
