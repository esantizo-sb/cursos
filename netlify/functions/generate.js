// netlify/functions/generate.js

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;
        const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/google/gemma-7b-it";

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
            body: JSON.stringify({ "inputs": prompt })
        });

        // MANEJO DEL ERROR 503 (MODELO CARGANDO)
        if (response.status === 503) {
            const errorBody = await response.json();
            const estimatedTime = errorBody.estimated_time || 20; // Tiempo estimado en segundos
            // Devolvemos un mensaje claro al frontend para que el usuario sepa qué pasa
            return { 
                statusCode: 503, 
                body: `El modelo de IA se está cargando. Por favor, inténtalo de nuevo en ${Math.round(estimatedTime)} segundos.` 
            };
        }

        if (!response.ok) {
            const errorBody = await response.text();
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
