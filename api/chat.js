// api/chat.js

export default async function handler(req, res) {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { messages, systemPrompt, temperature, topP } = req.body;

        // Configurações do Azure
        const endpoint = req.body.endpoint || process.env.AZURE_OPENAI_ENDPOINT || "https://marcosprojresource.openai.azure.com/openai/v1";
        const apiKey = req.body.apiKey || process.env.AZURE_OPENAI_KEY || "";
        const deployment = req.body.deployment || process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4.1";
        
        // Parâmetros de comportamento da IA
        const systemInstruction = systemPrompt || process.env.AZURE_SYSTEM_PROMPT || "Você é um assistente virtual útil integrado ao Azure OpenAI.";
        const tempValue = temperature !== undefined ? parseFloat(temperature) : (process.env.AZURE_TEMPERATURE ? parseFloat(process.env.AZURE_TEMPERATURE) : 0.7);
        const topPValue = topP !== undefined ? parseFloat(topP) : (process.env.AZURE_TOP_P ? parseFloat(process.env.AZURE_TOP_P) : 0.9);

        // Montar histórico de mensagens com a instrução de sistema no topo
        const apiMessages = [
            { role: 'system', content: systemInstruction }
        ];

        if (messages && Array.isArray(messages)) {
            apiMessages.push(...messages);
        }

        const url = `${endpoint.replace(/\/$/, "")}/chat/completions`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify({
                model: deployment,
                messages: apiMessages,
                temperature: tempValue,
                top_p: topPValue,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            return res.status(response.status).json({ error: `Erro na API Azure OpenAI: ${errBody}` });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error("Erro na Rota da API Vercel:", error);
        return res.status(500).json({ error: error.message });
    }
}
