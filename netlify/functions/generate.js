// netlify/functions/generate.js

export async function handler(event) {
    // 1. Verificamos que la solicitud sea del tipo correcto (POST)
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 2. Obtenemos el token secreto de las variables de entorno de Netlify
        const HUGGING_FACE_TOKEN = process.env.HUGGING_FACE_TOKEN;

        // 3. Definimos la URL del modelo Zephyr (100% abierto)
        //    Y nos aseguramos de que el nombre de la variable sea consistente.
        const API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";

        // 4. Extraemos el "prompt" que nos envió el index.html
        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            return { statusCode: 400, body: 'Prompt is required' };
        }

        // 5. Hacemos la llamada a Hugging Face usando la variable API_URL
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HUGGING_FACE_TOKEN}`
            },
            body: JSON.stringify({
                "inputs": prompt,
            })
        });

        // 6. Si la respuesta de Hugging Face no es exitosa, devolvemos el error
        if (!response.ok) {
            const errorBody = await response.text();
            return { statusCode: response.status, body: `Error from Hugging Face: ${errorBody}` };
        }

        // 7. Si todo fue bien, procesamos la respuesta y la enviamos de vuelta al index.html
        const result = await response.json();
        const generatedText = result[0]?.generated_text;

        const cleanText = generatedText.replace(prompt, "").trim();

        return {
            statusCode: 200,
            body: JSON.stringify({ text: cleanText })
        };

    } catch (error) {
        // Si ocurre cualquier otro error, lo capturamos aquí
        return { statusCode: 500, body: `Server error: ${error.message}` };
    }
}
