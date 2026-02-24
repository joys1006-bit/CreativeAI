async function runSelfTest() {
    console.log("=== CreativeAI Insight 자가 검증 시스템 (Standard Fetch) 가동 ===");

    // 1. Backend Stats API Test
    try {
        const statsRes = await fetch('http://localhost:8000/stats');
        const statsData = await statsRes.json();
        console.log("✅ [BACKEND] Stats API: SUCCESS", statsData);
    } catch (e) {
        console.error("❌ [BACKEND] Stats API: FAILED", e.message);
    }

    // 2. Frontend Dev Server Check
    try {
        const feRes = await fetch('http://localhost:5173');
        if (feRes.status === 200) {
            console.log("✅ [FRONTEND] Dev Server (5173): SUCCESS - Serving Content");
        }
    } catch (e) {
        console.error("❌ [FRONTEND] Dev Server (5173): FAILED - Is frontend running?", e.message);
    }

    // 3. Backend Video Upload Endpoint Ready Check
    try {
        const statusRes = await fetch('http://localhost:8000/status/non-existent-id');
        if (statusRes.status === 404) {
            console.log("✅ [BACKEND] Job Status Endpoint: ACTIVE (404 for random ID as expected)");
        }
    } catch (e) {
        console.error("❌ [BACKEND] Job Status Endpoint: FAILED", e.message);
    }

    console.log("=== 자가 점검 완료 ===");
}

runSelfTest();
