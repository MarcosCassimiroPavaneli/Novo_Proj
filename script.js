// script.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const btnMenu = document.getElementById('btn-menu');
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const btnNewChat = document.getElementById('btn-new-chat');
    const chatInput = document.getElementById('chat-input');
    const btnSend = document.getElementById('btn-send');
    const chatArea = document.getElementById('chat-area');
    const welcomeScreen = document.getElementById('welcome-screen');
    const messagesContainer = document.getElementById('messages-container');
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    const recentList = document.getElementById('recent-list');

    // Toggle Sidebar on Desktop
    btnMenu.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Toggle Sidebar on Mobile
    btnMobileMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('mobile-open');
    });

    // Close mobile sidebar when clicking on the chat area
    chatArea.addEventListener('click', () => {
        if (sidebar.classList.contains('mobile-open')) {
            sidebar.classList.remove('mobile-open');
        }
    });

    // Auto-resize input textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight) + 'px';
        
        // Enable/Disable send button
        if (chatInput.value.trim() !== '') {
            btnSend.classList.remove('disabled');
            btnSend.disabled = false;
        } else {
            btnSend.classList.add('disabled');
            btnSend.disabled = true;
        }
    });

    // New Chat Button
    btnNewChat.addEventListener('click', () => {
        messagesContainer.innerHTML = '';
        messagesContainer.style.display = 'none';
        welcomeScreen.style.display = 'flex';
        chatInput.value = '';
        chatInput.style.height = '24px';
        btnSend.classList.add('disabled');
        btnSend.disabled = true;
    });

    // Suggestion Cards click
    suggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.getAttribute('data-prompt');
            chatInput.value = prompt;
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight) + 'px';
            btnSend.classList.remove('disabled');
            btnSend.disabled = false;
            sendMessage();
        });
    });

    // Send on Enter key (without Shift)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    btnSend.addEventListener('click', sendMessage);

    // Send Message Lógica
    function sendMessage() {
        const text = chatInput.value.trim();
        if (text === '') return;

        // Hide welcome screen, show messages container
        if (welcomeScreen.style.display !== 'none') {
            welcomeScreen.style.display = 'none';
            messagesContainer.style.display = 'flex';
        }

        // Add user message to UI
        appendUserMessage(text);

        // Add recent item dynamically
        addRecentChatItem(text);

        // Clear input and reset textarea height
        chatInput.value = '';
        chatInput.style.height = '24px';
        btnSend.classList.add('disabled');
        btnSend.disabled = true;

        // Add bot loading shimmer
        const loadingId = appendBotShimmer();
        scrollToBottom();

        // Simulate API call to Azure
        setTimeout(() => {
            removeBotShimmer(loadingId);
            const responseText = getMockResponse(text);
            appendBotMessageWithTyping(responseText);
        }, 1500);
    }

    function appendUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `
            <div class="message-content-wrapper">
                <div class="message-content">
                    <p>${escapeHTML(text).replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `;
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    function appendBotShimmer() {
        const id = 'shimmer-' + Date.now();
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        messageDiv.id = id;
        messageDiv.innerHTML = `
            <div class="message-icon">
                <span class="material-symbols-outlined">auto_awesome</span>
            </div>
            <div class="message-content-wrapper">
                <div class="loading-container">
                    <div class="shimmer-line w-full"></div>
                    <div class="shimmer-line w-90"></div>
                    <div class="shimmer-line w-75"></div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(messageDiv);
        return id;
    }

    function removeBotShimmer(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }

    function appendBotMessageWithTyping(markdownText) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        
        // Structure the message elements
        messageDiv.innerHTML = `
            <div class="message-icon">
                <span class="material-symbols-outlined">auto_awesome</span>
            </div>
            <div class="message-content-wrapper">
                <div class="message-content"></div>
                <div class="message-actions" style="opacity: 0;">
                    <button class="btn-icon" title="Gostei"><span class="material-symbols-outlined">thumb_up</span></button>
                    <button class="btn-icon" title="Não gostei"><span class="material-symbols-outlined">thumb_down</span></button>
                    <button class="btn-icon" title="Compartilhar"><span class="material-symbols-outlined">share</span></button>
                    <button class="btn-icon" title="Mais"><span class="material-symbols-outlined">more_vert</span></button>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        const contentDiv = messageDiv.querySelector('.message-content');
        const actionsDiv = messageDiv.querySelector('.message-actions');

        // Render markdown to full HTML content
        const parsedHTML = formatMarkdown(markdownText);
        
        // We will do a word-by-word reveal typing effect on the parsed HTML!
        // To do this simply without breaking tag syntax, we can render the elements gradually 
        // or simulate typing by inserting content and showing it.
        // Let's use a robust tag-aware typewriter or a simple progressive text renderer.
        // Simple and robust approach: append HTML immediately, but use opacity/fade transitions or reveal line-by-line.
        // Better: typewrite paragraphs and lists smoothly.
        // Let's implement a clean word-by-word typing effect:
        
        contentDiv.innerHTML = parsedHTML;
        
        // Make sure all elements in contentDiv start hidden, and then reveal them smoothly
        const allParagraphs = contentDiv.querySelectorAll('p, li, pre, ul, ol');
        allParagraphs.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(5px)';
            el.style.transition = 'opacity 0.25s ease-out, transform 0.25s ease-out';
        });

        let index = 0;
        function revealNextElement() {
            if (index < allParagraphs.length) {
                allParagraphs[index].style.opacity = '1';
                allParagraphs[index].style.transform = 'translateY(0)';
                index++;
                scrollToBottom();
                setTimeout(revealNextElement, 150);
            } else {
                // Fade in action buttons at the end
                actionsDiv.style.transition = 'opacity 0.3s ease-out';
                actionsDiv.style.opacity = '1';
            }
        }
        
        revealNextElement();
        scrollToBottom();
    }

    function scrollToBottom() {
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    function addRecentChatItem(text) {
        // Truncate text
        const truncated = text.length > 28 ? text.substring(0, 25) + '...' : text;
        
        // Remove active state from current items
        const currentActives = recentList.querySelectorAll('.recent-item');
        currentActives.forEach(item => item.classList.remove('active'));

        const itemDiv = document.createElement('div');
        itemDiv.className = 'recent-item active';
        itemDiv.innerHTML = `
            <span class="material-symbols-outlined">chat_bubble</span>
            <span class="recent-text">${escapeHTML(truncated)}</span>
        `;
        
        // Insert at the top of the list
        if (recentList.firstChild) {
            recentList.insertBefore(itemDiv, recentList.firstChild);
        } else {
            recentList.appendChild(itemDiv);
        }

        // Limit to 5 items for demonstration
        while (recentList.children.length > 6) {
            recentList.lastChild.remove();
        }
    }

    // Escape raw HTML strings
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Markdown Parser (supports bold, lists, and code blocks)
    function formatMarkdown(text) {
        let formatted = text;
        
        // Parse Code blocks (```lang ... ```)
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        formatted = formatted.replace(codeBlockRegex, (match, lang, code) => {
            const escapedCode = escapeHTML(code.trim());
            const displayLang = lang || 'code';
            return `<div class="code-block">
                <div class="code-header">
                    <span class="code-lang">${displayLang}</span>
                    <button class="btn-copy-code" onclick="window.copyCode(this)">
                        <span class="material-symbols-outlined">content_copy</span>
                        <span>Copiar código</span>
                    </button>
                </div>
                <pre><code>${escapedCode}</code></pre>
            </div>`;
        });

        // Parse bold text (**text**)
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Parse list items (- item)
        const lines = formatted.split('\n');
        let inList = false;
        let listHTML = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Skip parsing inside code blocks (handled globally above)
            if (line.includes('<div') || line.includes('</div') || line.includes('<pre') || line.includes('<code') || line.includes('</pre') || line.includes('</code')) {
                listHTML.push(line);
                continue;
            }

            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                const liContent = trimmedLine.substring(2);
                if (!inList) {
                    inList = true;
                    listHTML.push('<ul><li>' + liContent + '</li>');
                } else {
                    listHTML.push('<li>' + liContent + '</li>');
                }
            } else {
                if (inList) {
                    inList = false;
                    listHTML.push('</ul>');
                }
                if (trimmedLine !== '') {
                    listHTML.push('<p>' + line + '</p>');
                } else {
                    listHTML.push(line);
                }
            }
        }
        if (inList) {
            listHTML.push('</ul>');
        }
        
        formatted = listHTML.join('\n');
        return formatted;
    }

    // Global copy to clipboard function
    window.copyCode = function(button) {
        const codeElement = button.closest('.code-block').querySelector('pre code');
        const textToCopy = codeElement.textContent;

        navigator.clipboard.writeText(textToCopy).then(() => {
            const label = button.querySelector('span:last-child');
            const icon = button.querySelector('span:first-child');
            
            label.textContent = 'Copiado!';
            icon.textContent = 'check';
            button.style.color = '#0df094';

            setTimeout(() => {
                label.textContent = 'Copiar código';
                icon.textContent = 'content_copy';
                button.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('Falha ao copiar:', err);
        });
    };

    // Simulated Response Generator
    function getMockResponse(prompt) {
        const pLower = prompt.toLowerCase();

        if (pLower.includes('azure ai hub') || pLower.includes('ai hub') || pLower.includes('explique o que é')) {
            return `O **Azure AI Hub** é o ambiente de desenvolvimento colaborativo da Microsoft para criar, avaliar e implantar modelos de inteligência artificial de forma segura.

Aqui estão os principais componentes e recursos que você terá acesso:
- **Model Catalog:** Acesso unificado a dezenas de modelos abertos e fechados de ponta (como GPT-4, Llama 3, Phi-3, Mistral, etc.).
- **Azure OpenAI Service:** Integração nativa com modelos de inteligência artificial generativa da OpenAI com SLAs empresariais.
- **Prompt Flow:** Ferramenta visual para orquestrar fluxos de trabalho de LLM, integrando modelos com bancos de dados de vetor e código personalizado.
- **Segurança Corporativa:** Filtros robustos contra abuso (Content Safety) e proteção total dos dados corporativos.

Para iniciar seu projeto backend, você precisará instalar o SDK do Azure:
\`\`\`bash
npm install @azure/openai @azure/identity
\`\`\`

Deseja que eu escreva um código de exemplo em Node.js demonstrando como iniciar a conexão?`;
        }

        if (pLower.includes('node.js') || pLower.includes('script') || pLower.includes('api do azure')) {
            return `Aqui está um script básico em **Node.js** para consumir a API do Azure OpenAI utilizando a biblioteca oficial da Azure:

\`\`\`javascript
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

// Configurações do seu recurso na Azure
const endpoint = "https://seu-recurso.openai.azure.com/";
const apiKey = "SUA_CHAVE_API_AZURE";
const deploymentName = "gpt-4"; // Nome da implantação do modelo

async function main() {
  const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
  
  const messages = [
    { role: "system", content: "Você é um assistente virtual útil rodando na Azure." },
    { role: "user", content: "Olá! Como posso começar com Azure AI?" }
  ];

  const result = await client.getChatCompletions(deploymentName, messages);

  for (const choice of result.choices) {
    console.log(choice.message.content);
  }
}

main().catch((err) => {
  console.error("Erro na requisição:", err);
});
\`\`\`

**Dica:** Nunca adicione a sua chave de API (\`apiKey\`) diretamente no código. Utilize variáveis de ambiente (\`process.env.AZURE_API_KEY\`) para que a chave fique protegida no Vercel.`;
        }

        if (pLower.includes('serverless') || pLower.includes('arquitetura') || pLower.includes('vercel')) {
            return `Para estruturar uma arquitetura serverless no **Vercel** que se conecta a APIs de IA na Azure, recomendamos a seguinte abordagem:

- **Frontend:** Desenvolvido em HTML/JS estático (como esta própria interface), servido de forma ultra-rápida via CDN global do Vercel.
- **Backend Serverless (Vercel Functions):** Criar rotas de API na pasta \`/api\` para fazer a ponte com a Azure. Isso esconde suas chaves de API secretas do cliente.
- **Segurança e Variáveis de Ambiente:** Defina \`AZURE_OPENAI_API_KEY\` e \`AZURE_OPENAI_ENDPOINT\` no painel do Vercel.

Exemplo de uma Vercel Serverless Function em JavaScript (\`api/chat.js\`):
\`\`\`javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  const { message } = req.body;
  
  // Chamada da API do Azure OpenAI
  const response = await fetch(\`\${process.env.AZURE_ENDPOINT}/openai/deployments/gpt-4/chat/completions?api-version=2023-05-15\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.AZURE_API_KEY
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }]
    })
  });
  
  const data = await response.json();
  return res.status(200).json(data);
}
\`\`\``;
        }

        if (pLower.includes('roteiro') || pLower.includes('estudos') || pLower.includes('semanas')) {
            return `Criar um roteiro estruturado para Inteligência Artificial Aplicada é excelente. Aqui está um plano focado de 4 semanas para você aprender a integrar IA (Azure/OpenAI) em aplicações web:

- **Semana 1: Fundamentos de Engenharia de Prompt e LLMs**
  - Entender como os modelos de linguagem funcionam e técnicas de prompt (Zero-shot, Few-shot, Chain of Thought).
  - Testar chamadas simples via cURL/Postman usando APIs públicas.
- **Semana 2: Desenvolvimento de Backend com SDKs de IA**
  - Desenvolver rotas de API em Node.js/Python para enviar prompts e tratar respostas.
  - Implementar gerenciamento de memória simples (histórico de chat) enviado nas mensagens.
- **Semana 3: Bancos de Vetores e RAG (Retrieval-Augmented Generation)**
  - Entender o que são Embeddings e por que eles são necessários para dar contexto personalizado.
  - Conectar seu chatbot a dados externos usando um banco de vetores simples (ex: Pinecone, ChromaDB ou Azure AI Search).
- **Semana 4: Deploy e Monitoramento em Produção**
  - Implantar a aplicação frontend + backend no Vercel configurando variáveis secretas.
  - Adicionar segurança, tratamento de erros e testar latência.

Deseja que eu te sugira leituras ou documentações específicas para iniciar a **Semana 1**?`;
        }

        // Default Simulated Response
        return `Entendi perfeitamente sua solicitação! Esta interface frontend é um protótipo idêntico ao **Gemini Advanced** com tema escuro e está funcionando atualmente em modo de simulação.

Como seu objetivo final é criar o chatbot conectado à **Azure** hospedado no Vercel, o caminho técnico recomendado a seguir será:
- **1. Criar sua Rota de API no Vercel:** Escrever um arquivo de rota de API (ex: \`api/chat.js\`) para receber a mensagem do usuário e encaminhar para a Azure.
- **2. Integrar com Azure OpenAI:** Adquirir as credenciais do Azure OpenAI Service no portal da Microsoft (Azure Endpoint, Chave API e nome da implantação).
- **3. Atualizar o script.js:** Modificar a função \`sendMessage()\` para enviar os dados reais via \`fetch('/api/chat')\` em vez de retornar esta resposta simulada.

Gostaria de ver o código-fonte sugerido para essa rota de API no Vercel para você adicionar ao projeto?`;
    }
});
