// netlify/functions/generate.js

export async function handler(event) {
    // Solo permitimos solicitudes POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;
        // Esta es la URL que probablemente tenía el error. La hemos corregido.
        const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            return { statusCode: 400, body: 'Prompt is required' };
        }

        const response = await fetch(HUGGING_FACE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HUGGING_FACE_TOKEN}`
            },
            body: JSON.stringify({
                "inputs": prompt,
                "parameters": { "max_new_tokens": 100, "return_full_text": false }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            // Devolvemos el error exacto que nos da Hugging Face para poder depurar
            return { statusCode: response.status, body: `Error from Hugging Face: ${errorBody}` };
        }

        const result = await response.json();
        const generatedText = result[0]?.generated_text;

        return {
            statusCode: 200,
            body: JSON.stringify({ text: generatedText ? generatedText.trim() : "" })
        };

    } catch (error) {
        return { statusCode: 500, body: `Server error: ${error.message}` };
    }
}
