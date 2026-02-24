const axios = require('axios');

async function testVideoGeneration() {
    const topic = "Stock Dividend Investment Strategies";
    console.log(`[TEST] Starting video generation for topic: "${topic}"`);

    try {
        // 1. Start Job
        const startRes = await axios.post('http://localhost:8000/generate/video', { topic });
        const { jobId } = startRes.data;
        console.log(`[TEST] Job started. Job ID: ${jobId}`);

        // 2. Poll Status
        let status = 'PENDING';
        while (status !== 'COMPLETED' && status !== 'FAILED') {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
            const statusRes = await axios.get(`http://localhost:8000/status/${jobId}`);
            status = statusRes.data.status;
            console.log(`[TEST] Status: ${status}`);

            if (status === 'FAILED') {
                console.error(`[TEST] Generation FAILED: ${statusRes.data.error}`);
                return;
            }
        }

        console.log(`[TEST] Generation COMPLETED!`);
        console.log(`[TEST] Video Path: http://localhost:8000/uploads/${jobId}_final.mp4`);

    } catch (error) {
        console.error('[TEST] Error:', error.message);
        if (error.response) {
            console.error('[TEST] Response Data:', error.response.data);
        }
    }
}

testVideoGeneration();
