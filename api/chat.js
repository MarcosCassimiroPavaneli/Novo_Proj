// api/chat.js

module.exports = async function handler(req, res) {
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
        const apiKey   = req.body.apiKey   || process.env.AZURE_OPENAI_KEY       || "";
        const deployment = req.body.deployment || process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4.1";

        // Parâmetros de comportamento da IA
        const userSystemInstruction = systemPrompt
            || process.env.AZURE_SYSTEM_PROMPT
            || "Você é um assistente virtual útil integrado ao Azure OpenAI.";

        const tempValue  = temperature !== undefined ? parseFloat(temperature) : 0.7;
        const topPValue  = topP        !== undefined ? parseFloat(topP)        : 0.9;

        // Instrução adicional: modelo deve sempre incluir IMAGE_QUERY no final
        const imageInstruction = `

Ao final de TODA resposta, sem exceção, adicione exatamente esta linha (sem formatação markdown, em inglês):
IMAGE_QUERY: [3 palavras-chave em inglês para buscar uma foto relevante sobre o assunto principal]

Exemplo: IMAGE_QUERY: python programming code
Exemplo: IMAGE_QUERY: golden retriever dog
Exemplo: IMAGE_QUERY: Rio de Janeiro skyline`;

        const finalSystemInstruction = userSystemInstruction + imageInstruction;

        // Montar histórico de mensagens
        const apiMessages = [
            { role: 'system', content: finalSystemInstruction }
        ];

        if (messages && Array.isArray(messages)) {
            apiMessages.push(...messages);
        }

        const url = `${endpoint.replace(/\/$/, "")}/chat/completions`;

        const azureResponse = await fetch(url, {
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
                max_tokens: 1200
            })
        });

        if (!azureResponse.ok) {
            const errBody = await azureResponse.text();
            return res.status(azureResponse.status).json({ error: `Erro na API Azure OpenAI: ${errBody}` });
        }

        const data = await azureResponse.json();
        const rawContent = data.choices?.[0]?.message?.content || "";

        // Extrair IMAGE_QUERY do final da resposta
        const imageQueryMatch = rawContent.match(/IMAGE_QUERY:\s*(.+)$/im);
        const imageQuery      = imageQueryMatch ? imageQueryMatch[1].trim() : null;

        // Limpar a resposta removendo a linha IMAGE_QUERY
        const cleanContent = rawContent.replace(/\nIMAGE_QUERY:\s*.+$/im, "").trimEnd();

        // Substituir conteúdo limpo na estrutura de resposta
        if (data.choices?.[0]?.message) {
            data.choices[0].message.content = cleanContent;
        }

        // Buscar imagem relevante
        let imageUrl = null;
        if (imageQuery) {
            imageUrl = await fetchImageFromPexels(imageQuery)
                    || await fetchImageFromWikipedia(imageQuery);
        }

        // Retornar resposta enriquecida com imagem
        return res.status(200).json({
            ...data,
            imageUrl,
            imageQuery
        });

    } catch (error) {
        console.error("Erro na Rota da API Vercel:", error);
        return res.status(500).json({ error: error.message });
    }
}

// --- Pexels API (requer PEXELS_API_KEY nas env vars) ---
async function fetchImageFromPexels(query) {
    const pexelsKey = process.env.PEXELS_API_KEY;
    if (!pexelsKey) return null;

    try {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodedQuery}&per_page=1&orientation=landscape`,
            {
                headers: { 'Authorization': pexelsKey }
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
            // Retorna a versão "landscape" otimizada (940px de largura)
            return data.photos[0].src.landscape || data.photos[0].src.large;
        }
    } catch {
        // Silenciar erro e retornar null para tentar fallback
    }

    return null;
}

// --- Wikipedia API Fallback (sem chave necessária) ---
async function fetchImageFromWikipedia(query) {
    try {
        // Buscar no Wikipedia em inglês
        const encodedQuery = encodeURIComponent(query);
        const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`;

        let response = await fetch(searchUrl, {
            headers: { 'User-Agent': 'GeminiAzureAssistant/1.0' }
        });

        // Se não encontrou direto, tenta busca
        if (!response.ok) {
            const searchApiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodedQuery}&format=json&srlimit=1`;
            const searchResponse = await fetch(searchApiUrl, {
                headers: { 'User-Agent': 'GeminiAzureAssistant/1.0' }
            });

            if (!searchResponse.ok) return null;

            const searchData = await searchResponse.json();
            const firstResult = searchData.query?.search?.[0];
            if (!firstResult) return null;

            const title = encodeURIComponent(firstResult.title);
            response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
                headers: { 'User-Agent': 'GeminiAzureAssistant/1.0' }
            });

            if (!response.ok) return null;
        }

        const pageData = await response.json();

        // Preferir thumbnail de alta resolução
        if (pageData.originalimage?.source) {
            return pageData.originalimage.source;
        }
        if (pageData.thumbnail?.source) {
            // Aumentar resolução do thumbnail
            return pageData.thumbnail.source.replace(/\/\d+px-/, '/800px-');
        }
    } catch {
        // Silenciar erro
    }

    return null;
}
