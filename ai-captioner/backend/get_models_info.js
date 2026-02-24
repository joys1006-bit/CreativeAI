const fs = require('fs');
const key = 'AIzaSyAfdyy0CkQ0lbvSj3VQYinUZvn41ztjb_w';

async function getInfo() {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const d = await res.json();
        const info = d.models.map(m => `${m.name}: ${m.supportedGenerationMethods.join(',')}`).join('\n');
        fs.writeFileSync('models_info.txt', info);
        console.log("Success: models_info.txt created.");
    } catch (e) {
        console.error("Error:", e.message);
    }
}

getInfo();
