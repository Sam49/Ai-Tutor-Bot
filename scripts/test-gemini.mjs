const apiKey = "AIzaSyBKwvDL7U0Or2ThSJ4gs0IjmD9iGwcn1kw";
const baseUrl = "https://generativelanguage.googleapis.com/v1beta";

async function listModels() {
    console.log("Listing models...");
    try {
        const response = await fetch(`${baseUrl}/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            console.log("Available models:");
            data.models.forEach(model => console.log(`- ${model.name} (${model.displayName})`));
            return data.models.map(m => m.name.replace('models/', ''));
        } else {
            console.error("Failed to list models:", data);
            return [];
        }
    } catch (error) {
        console.error("Error listing models:", error.message);
        return [];
    }
}

async function testGenerate(modelName) {
    console.log(`\nTesting generation with model: ${modelName}...`);
    try {
        const response = await fetch(
            `${baseUrl}/models/${modelName}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Hello, tell me a joke." }] }]
                })
            }
        );

        if (response.ok) {
            const data = await response.json();
            console.log(`SUCCESS with ${modelName}!Response:`, data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 50) + "...");
            return true;
        } else {
            console.error(`FAILED with ${modelName}. Status: ${response.status} ${response.statusText}`);
            const errorData = await response.json().catch(() => ({}));
            console.error("Error details:", JSON.stringify(errorData, null, 2));
            return false;
        }
    } catch (error) {
        console.error(`ERROR with ${modelName}:`, error.message);
        return false;
    }
}

async function main() {
    const models = await listModels();

    // Try the one currently in code
    await testGenerate("gemini-2.5-flash");

    // Try verified models from list if available, or common ones
    const candidates = [
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-2.0-flash-exp",
        "gemini-pro"
    ];

    for (const candidate of candidates) {
        if (models.includes(candidate)) {
            await testGenerate(candidate);
        } else {
            // Try anyway just in case list is filtered but direct access works
            await testGenerate(candidate);
        }
    }
}

main();
