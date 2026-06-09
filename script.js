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
    const userAvatar = document.getElementById('user-avatar');

    // Modals DOM Elements
    const modalSettings = document.getElementById('modal-settings');
    const modalHelp = document.getElementById('modal-help');
    const modalActivity = document.getElementById('modal-activity');
    
    // Sidebar Modal Buttons
    const btnSettings = document.getElementById('btn-settings');
    const btnHelp = document.getElementById('btn-help');
    const btnActivity = document.getElementById('btn-activity');

    // Settings Modal Inputs & Tab Buttons
    const settingsUsername = document.getElementById('settings-username');
    const settingsProvider = document.getElementById('settings-provider');
    const azureEndpoint = document.getElementById('azure-endpoint');
    const azureKey = document.getElementById('azure-key');
    const azureDeployment = document.getElementById('azure-deployment');
    const azureSystemPrompt = document.getElementById('azure-system-prompt');
    const azureTemperature = document.getElementById('azure-temperature');
    const azureTopP = document.getElementById('azure-top-p');
    const btnSaveSettings = document.getElementById('btn-save-settings');
    const btnCancelSettings = document.getElementById('btn-cancel-settings');
    const settingsTabs = document.querySelectorAll('.settings-tabs .tab-btn');
    const settingsTabContents = document.querySelectorAll('.modal-body .tab-content');
    const themeOptions = document.querySelectorAll('.theme-option');

    // Activity Log DOM
    const activityLogList = document.getElementById('activity-log-list');
    const btnClearActivity = document.getElementById('btn-clear-activity');

    // State
    let appState = {
        userName: 'Marcos',
        aiProvider: 'azure', // Padrão agora é Azure
        azureEndpoint: 'https://marcosprojresource.openai.azure.com/openai/v1',
        azureKey: '',
        azureDeployment: 'gpt-4.1',
        azureSystemPrompt: 'Você é um assistente virtual útil integrado ao Azure OpenAI. Responda de forma concisa.',
        azureTemperature: 0.7,
        azureTopP: 0.9,
        selectedTheme: 'theme-default',
        activityLogs: []
    };

    // Histórico de Conversa
    let conversationHistory = [];

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
        conversationHistory = [];
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
    async function sendMessage() {
        const text = chatInput.value.trim();
        if (text === '') return;

        // Hide welcome screen, show messages container
        if (welcomeScreen.style.display !== 'none') {
            welcomeScreen.style.display = 'none';
            messagesContainer.style.display = 'flex';
        }

        // Add user message to UI
        appendUserMessage(text);
        conversationHistory.push({ role: 'user', content: text });

        // Add recent item dynamically
        addRecentChatItem(text);
        logActivity(`Mensagem enviada pelo usuário: "${text.substring(0, 30)}..."`);

        // Clear input and reset textarea height
        chatInput.value = '';
        chatInput.style.height = '24px';
        btnSend.classList.add('disabled');
        btnSend.disabled = true;

        // Add bot loading shimmer
        const loadingId = appendBotShimmer();
        scrollToBottom();

        if (appState.aiProvider === 'azure') {
            logActivity(`Iniciando chamada para a Azure OpenAI (${appState.azureDeployment})...`);
            try {
                const responseText = await fetchAzureOpenAI(text);
                removeBotShimmer(loadingId);
                appendBotMessageWithTyping(responseText);
                logActivity(`Resposta recebida com sucesso da Azure OpenAI.`);
            } catch (error) {
                removeBotShimmer(loadingId);
                const errorMessage = `**Erro ao conectar com o recurso do Azure OpenAI:**\n\n- Detalhe: ${error.message}\n\n*Nota: Chamadas diretas do navegador para a Azure podem ser bloqueadas por política de CORS. Para uso em produção, recomenda-se criar uma rota serverless no Vercel (como explicado no menu de ajuda).* \n\n**Retornando resposta simulada (fallback):**\n\n${getMockResponse(text)}`;
                appendBotMessageWithTyping(errorMessage);
                logActivity(`Falha na chamada da Azure: ${error.message}. Fallback simulado ativo.`);
            }
        } else {
            // Simulate API call to Azure (Fallback)
            setTimeout(() => {
                removeBotShimmer(loadingId);
                const responseText = getMockResponse(text);
                appendBotMessageWithTyping(responseText);
                logActivity(`Resposta simulada gerada com sucesso.`);
            }, 1200);
        }
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
        conversationHistory.push({ role: 'assistant', content: markdownText });
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

    }

    // --- State and LocalStorage Manager ---
    function initAppState() {
        // Load Username
        if (localStorage.getItem('userName')) {
            appState.userName = localStorage.getItem('userName');
        }
        
        // Load Provider
        if (localStorage.getItem('aiProvider')) {
            appState.aiProvider = localStorage.getItem('aiProvider');
        } else {
            appState.aiProvider = 'azure'; // Padrão é Azure
        }
        
        // Load Azure config
        appState.azureEndpoint = localStorage.getItem('azureEndpoint') || 'https://marcosprojresource.openai.azure.com/openai/v1';
        appState.azureKey = localStorage.getItem('azureKey') || '';
        appState.azureDeployment = localStorage.getItem('azureDeployment') || 'gpt-4.1';
        appState.azureSystemPrompt = localStorage.getItem('azureSystemPrompt') || 'Você é um assistente virtual útil integrado ao Azure OpenAI. Responda de forma concisa.';
        
        const storedTemp = localStorage.getItem('azureTemperature');
        appState.azureTemperature = storedTemp !== null ? parseFloat(storedTemp) : 0.7;
        
        const storedTopP = localStorage.getItem('azureTopP');
        appState.azureTopP = storedTopP !== null ? parseFloat(storedTopP) : 0.9;
        
        // Load Theme
        if (localStorage.getItem('selectedTheme')) {
            appState.selectedTheme = localStorage.getItem('selectedTheme');
        }

        // Load Activity logs
        if (localStorage.getItem('activityLogs')) {
            try {
                appState.activityLogs = JSON.parse(localStorage.getItem('activityLogs'));
            } catch(e) {
                appState.activityLogs = [];
            }
        } else {
            appState.activityLogs = [{
                time: new Date().toLocaleTimeString(),
                message: 'Sessão iniciada e conectada ao GitHub / Vercel.'
            }];
        }

        // Apply UI state
        applyUIState();
    }

    function applyUIState() {
        // Update username in greeting
        const greetingSpan = welcomeScreen.querySelector('.welcome-header h1 span');
        if (greetingSpan) {
            greetingSpan.textContent = appState.userName;
        }

        // Update username in inputs
        settingsUsername.value = appState.userName;

        // Update provider select
        settingsProvider.value = appState.aiProvider;

        // Update Azure inputs
        azureEndpoint.value = appState.azureEndpoint;
        azureKey.value = appState.azureKey;
        azureDeployment.value = appState.azureDeployment;
        azureSystemPrompt.value = appState.azureSystemPrompt;
        azureTemperature.value = appState.azureTemperature;
        azureTopP.value = appState.azureTopP;

        // Apply theme to body
        document.body.className = '';
        if (appState.selectedTheme !== 'theme-default') {
            document.body.classList.add(appState.selectedTheme);
        }

        // Update theme options active class
        themeOptions.forEach(opt => {
            opt.classList.remove('active');
            if (opt.getAttribute('data-theme') === appState.selectedTheme) {
                opt.classList.add('active');
            }
        });

        // Update user avatar initials
        if (appState.userName) {
            const initials = appState.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            userAvatar.textContent = initials || 'MC';
            userAvatar.title = appState.userName;
        }

        // Render activity logs
        renderActivityLogs();
    }

    // --- Modals Controller ---
    function openModal(modal) {
        modal.style.display = 'flex';
        // Trigger reflow for transition
        modal.offsetHeight;
        modal.classList.add('active');
        logActivity(`Modal aberto: ${modal.id.replace('modal-', '')}`);
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
    }

    // Sidebar buttons click listeners
    btnSettings.addEventListener('click', () => openModal(modalSettings));
    btnHelp.addEventListener('click', () => openModal(modalHelp));
    btnActivity.addEventListener('click', () => {
        renderActivityLogs();
        openModal(modalActivity);
    });
    userAvatar.addEventListener('click', () => openModal(modalSettings));

    // Close buttons event listeners
    const closeButtons = document.querySelectorAll('.btn-close-modal, .btn-close-modal-footer');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const openModalOverlay = btn.closest('.modal-overlay');
            if (openModalOverlay) {
                closeModal(openModalOverlay);
            }
        });
    });

    // Close on overlay backdrop click
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
            }
        });
    });

    // Settings Tabs switching logic
    settingsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            settingsTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const targetContentId = tab.getAttribute('data-tab');
            settingsTabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetContentId) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Theme Selection click
    themeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            themeOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            const newTheme = opt.getAttribute('data-theme');
            
            // Preview immediately
            document.body.className = '';
            if (newTheme !== 'theme-default') {
                document.body.classList.add(newTheme);
            }
        });
    });

    // Settings actions (Save and Cancel)
    btnCancelSettings.addEventListener('click', () => {
        // Reset theme changes to saved state
        document.body.className = '';
        if (appState.selectedTheme !== 'theme-default') {
            document.body.classList.add(appState.selectedTheme);
        }
        closeModal(modalSettings);
    });

    btnSaveSettings.addEventListener('click', () => {
        // Save values to state
        appState.userName = settingsUsername.value.trim() || 'Marcos';
        appState.aiProvider = settingsProvider.value;
        appState.azureEndpoint = azureEndpoint.value.trim() || 'https://marcosprojresource.openai.azure.com/openai/v1';
        appState.azureKey = azureKey.value.trim() || '';
        appState.azureDeployment = azureDeployment.value.trim() || 'gpt-4.1';
        appState.azureSystemPrompt = azureSystemPrompt.value.trim() || 'Você é um assistente virtual útil integrado ao Azure OpenAI. Responda de forma concisa.';
        appState.azureTemperature = parseFloat(azureTemperature.value) || 0.7;
        appState.azureTopP = parseFloat(azureTopP.value) || 0.9;
        
        // Find active theme option
        const activeThemeOpt = document.querySelector('.theme-option.active');
        appState.selectedTheme = activeThemeOpt ? activeThemeOpt.getAttribute('data-theme') : 'theme-default';

        // Persist to localStorage
        localStorage.setItem('userName', appState.userName);
        localStorage.setItem('aiProvider', appState.aiProvider);
        localStorage.setItem('azureEndpoint', appState.azureEndpoint);
        localStorage.setItem('azureKey', appState.azureKey);
        localStorage.setItem('azureDeployment', appState.azureDeployment);
        localStorage.setItem('azureSystemPrompt', appState.azureSystemPrompt);
        localStorage.setItem('azureTemperature', appState.azureTemperature);
        localStorage.setItem('azureTopP', appState.azureTopP);
        localStorage.setItem('selectedTheme', appState.selectedTheme);

        logActivity('Configurações atualizadas e salvas com sucesso.');
        
        // Reapply settings to update UI
        applyUIState();
        closeModal(modalSettings);
    });

    // --- Activity Log Helper ---
    function logActivity(message) {
        const newLog = {
            time: new Date().toLocaleTimeString(),
            message: message
        };
        appState.activityLogs.unshift(newLog); // Prepend log

        // Limit to 50 logs
        if (appState.activityLogs.length > 50) {
            appState.activityLogs.pop();
        }

        localStorage.setItem('activityLogs', JSON.stringify(appState.activityLogs));
        renderActivityLogs();
    }

    function renderActivityLogs() {
        if (!activityLogList) return;
        activityLogList.innerHTML = '';
        
        appState.activityLogs.forEach(log => {
            const logItem = document.createElement('div');
            logItem.className = 'activity-log-item';
            logItem.innerHTML = `
                <span class="log-time">${log.time}</span>
                <p class="log-message">${escapeHTML(log.message)}</p>
            `;
            activityLogList.appendChild(logItem);
        });
    }

    btnClearActivity.addEventListener('click', () => {
        appState.activityLogs = [{
            time: new Date().toLocaleTimeString(),
            message: 'Histórico de atividade limpo.'
        }];
        localStorage.setItem('activityLogs', JSON.stringify(appState.activityLogs));
        renderActivityLogs();
    });

    // --- Azure OpenAI API Requester ---
    async function fetchAzureOpenAI(prompt) {
        // Envia a requisição para a rota servidora local /api/chat que atua como proxy
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: conversationHistory,
                systemPrompt: appState.azureSystemPrompt,
                temperature: appState.azureTemperature,
                topP: appState.azureTopP,
                endpoint: appState.azureEndpoint,
                apiKey: appState.azureKey,
                deployment: appState.azureDeployment
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `Erro do Servidor Vercel: ${response.status}`);
        }

        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            throw new Error("Resposta recebida do backend em formato inesperado (sem escolhas).");
        }
    }

    // Run Initialization
    initAppState();
});
