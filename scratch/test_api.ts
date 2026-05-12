
import { GoogleGenAI } from '@google/genai';

async function testModels() {
    const apiKey = 'AIzaSyDuYezizT5a2ZjBr5GjxjjFRk9Gb-G5A5s';
    const versions = ['v1', 'v1beta'];
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];

    for (const v of versions) {
        console.log(`--- Testing Version: ${v} ---`);
        const ai = new GoogleGenAI({ apiKey, apiVersion: v as any });
        for (const m of models) {
            try {
                const chat = ai.chats.create({ model: m });
                const resp = await chat.sendMessage({ message: 'hi' });
                console.log(`✅ Success: ${m} on ${v} -> ${resp.text.substring(0, 20)}...`);
            } catch (e: any) {
                console.log(`❌ Fail: ${m} on ${v} -> ${e.message}`);
            }
        }
    }
}

testModels();
