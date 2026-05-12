
import { GoogleGenAI } from '@google/genai';

async function testFutureModel() {
    const apiKey = 'AIzaSyDuYezizT5a2ZjBr5GjxjjFRk9Gb-G5A5s';
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];

    for (const m of models) {
        console.log(`--- Testing Model: ${m} ---`);
        const ai = new GoogleGenAI({ apiKey }); // Default version
        try {
            const chat = ai.chats.create({ model: m });
            const resp = await chat.sendMessage({ message: 'hi' });
            console.log(`✅ Success: ${m} -> ${resp.text.substring(0, 50)}...`);
        } catch (e: any) {
            console.log(`❌ Fail: ${m} -> ${e.message}`);
        }
    }
}

testFutureModel();
