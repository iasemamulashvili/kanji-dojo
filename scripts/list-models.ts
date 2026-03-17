import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error('Missing GOOGLE_GEMINI_API_KEY environment variable!');
}

const listModels = async () => {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        const models = data.models || [];

        const generateContentModels = models
            .filter((model: any) => model.supportedGenerationMethods?.includes('generateContent'))
            .map((model: any) => model.name);

        console.log('Available models supporting generateContent:');
        console.log(generateContentModels);

    } catch (error) {
        console.error('Error fetching list of models:', error);
    }
};

listModels();
