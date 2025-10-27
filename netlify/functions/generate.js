// netlify/functions/generate.js

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;
        const API_URL = "https://api-inference.huggingface.co/models/google/gemma-7b-it";

        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            return { statusCode: 400, body: 'Prompt is required' };
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HUGGING_FACE_TOKEN}`
            },
            // Enviamos el payload en el formato más simple posible
            body: JSON.stringify({
                "inputs": prompt,
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            return { statusCode: response.status, body: `Error from Hugging Face: ${errorBody}` };
        }

        const result = await response.json();
        const generatedText = result[0]?.generated_text;

        // Limpiamos el texto generado para quitar el prompt original que a veces se repite
        const cleanText = generatedText.replace(prompt, "").trim();

        return {
            statusCode: 200,
            body: JSON.stringify({ text: cleanText })
        };

    } catch (error) {
        return { statusCode: 500, body: `Server error: ${error.message}` };
    }
}
