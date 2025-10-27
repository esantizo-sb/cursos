// netlify/functions/generate.js

export async function handler(event) {
    console.log("Función 'generate' iniciada.");

    if (event.httpMethod !== 'POST') {
        console.log("Error: Método no permitido.", event.httpMethod);
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;
        const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

        // Imprimimos la URL que estamos usando para confirmar que es la correcta
        console.log("Llamando a la URL:", HUGGING_FACE_API_URL);
        
        if (!HUGGING_FACE_TOKEN) {
            console.error("Error: La variable de entorno HUGGING_FACE_TOKEN no está configurada.");
            return { statusCode: 500, body: 'Error de configuración del servidor: Falta el token.' };
        }

        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            console.error("Error: No se recibió un 'prompt' en la solicitud.");
            return { statusCode: 400, body: 'Prompt is required' };
        }

        console.log("Recibido prompt, llamando a Hugging Face...");
        const response = await fetch(HUGGING_FACE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HUGGING_FACE_TOKEN}`
            },
            body: JSON.stringify({ "inputs": prompt }) // Simplificado para máxima compatibilidad
        });

        console.log("Respuesta recibida de Hugging Face con estado:", response.status);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Error desde Hugging Face:", errorBody);
            return { statusCode: response.status, body: `Error from Hugging Face: ${errorBody}` };
        }

        const result = await response.json();
        console.log("Respuesta de Hugging Face procesada exitosamente.");
        
        const generatedText = result[0]?.generated_text;
        return {
            statusCode: 200,
            body: JSON.stringify({ text: generatedText ? generatedText.trim() : "" })
        };

    } catch (error) {
        console.error("Error catastrófico en la función:", error);
        return { statusCode: 500, body: `Server error: ${error.message}` };
    }
}
