
import { GoogleGenAI } from '@google/genai';

async function listModels() {
    const apiKey = 'AIzaSyDuYezizT5a2ZjBr5GjxjjFRk9Gb-G5A5s';
    const ai = new GoogleGenAI({ apiKey });
    try {
        const models = await ai.models.list();
        console.log('Available models:', JSON.stringify(models, null, 2));
    } catch (e: any) {
        console.error('Failed to list models:', e.message);
    }
}

listModels();
