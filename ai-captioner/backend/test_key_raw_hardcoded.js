const key = "AIzaSyAfdyy0CkQ0lbvSj3VQYinUZvn41ztjb_w".trim();

async function verifyQuietly() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    console.log("Key to check:", key);
    console.log("Checking endpoint:", url);

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            console.log("❌ Result: INVALID", JSON.stringify(data.error, null, 2));
        } else if (data.models) {
            console.log("✅ Result: VALID! Found", data.models.length, "models.");
            console.log("Sample model:", data.models[0].name);
        } else {
            console.log("❓ Result: UNKNOWN", data);
        }
    } catch (e) {
        console.error("💥 Network Error:", e.message);
    }
}

verifyQuietly();
