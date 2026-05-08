// ===== STATE =====
const PRO_TOOLS = ['seo', 'emails', 'brandname', 'social'];
const FREE_LIMIT = 5;

const state = {
    apiKey: localStorage.getItem('ecomgenius_apiKey') || '',
    model: localStorage.getItem('ecomgenius_model') || 'anthropic/claude-3.5-sonnet',
    currentTool: 'descriptions',
    tone: 'professional',
    platform: 'facebook',
    emailType: 'welcome',
    generating: false,
};

function getPlan() { return localStorage.getItem('ecomgenius_plan') || 'free'; }
function isPro() { const p = getPlan(); return p === 'pro' || p === 'agency'; }

function getUsage() {
    const data = JSON.parse(localStorage.getItem('ecomgenius_usage_data') || '{}');
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    if (data.month !== monthKey) return { month: monthKey, count: 0 };
    return data;
}
function incrementUsage() {
    const data = getUsage();
    data.count++;
    localStorage.setItem('ecomgenius_usage_data', JSON.stringify(data));
    updateUsageDisplay();
}
function canGenerate() {
    if (isPro()) return true;
    return getUsage().count < FREE_LIMIT;
}

// ===== TOOL CONFIG =====
const tools = {
    descriptions: {
        title: '📝 Product Description Generator',
        inputTitle: 'Product Details',
        showFields: ['productName', 'category', 'features', 'audience', 'tone'],
        buildPrompt: (d) =>
            `You are a world-class e-commerce copywriter. Write a high-converting product description using the AIDA framework (Attention, Interest, Desire, Action).\n\nProduct: ${d.productName}\nCategory: ${d.category}\nKey Features: ${d.features}\nTarget Audience: ${d.audience}\nTone: ${d.tone}\n\nRequirements:\n1. Attention: Start with a scroll-stopping hook that addresses a major pain point.\n2. Interest: Explain how the product solves the problem uniquely.\n3. Desire: Paint a vivid picture of the user's life after using the product. Use emotional triggers.\n4. Action: A strong, urgent Call-To-Action.\n5. Formatting: Use bullet points for key features, bold text for emphasis, and make it highly scannable.\n\nProvide two versions: A concise version (75 words) and an immersive storytelling version (200 words).`,
    },
    adcopy: {
        title: '📢 Ad Copy Generator',
        inputTitle: 'Ad Details',
        showFields: ['productName', 'category', 'features', 'audience', 'tone', 'platform'],
        buildPrompt: (d) =>
            `You are an elite media buyer and ad copywriter. Create hyper-converting ad copy specifically optimized for ${d.platform}.\n\nProduct: ${d.productName}\nCategory: ${d.category}\nKey Features: ${d.features}\nTarget Audience: ${d.audience}\nTone: ${d.tone}\nPlatform: ${d.platform}\n\nGenerate 3 completely different ad variations based on these frameworks:\n1. The PAS Framework (Problem, Agitation, Solution)\n2. The Social Proof/Review Angle (Make it look like a 5-star customer review)\n3. The Urgency/Scarcity Angle (FOMO driven)\n\nFor each variation include:\n- Hook / Headline (Platform specific length)\n- Primary Text\n- Call-to-action (CTA)\n- Visual Suggestion (What should the image/video show?)\nKeep the ${d.platform} algorithm in mind (e.g. use fast-paced hooks for TikTok, long-form storytelling for FB).`,
    },
    seo: {
        title: '🔍 SEO Optimizer',
        inputTitle: 'Product / Page Details',
        showFields: ['productName', 'category', 'features', 'audience'],
        buildPrompt: (d) =>
            `You are an expert E-commerce SEO Specialist. Generate a complete SEO content package for this product page.\n\nProduct: ${d.productName}\nCategory: ${d.category}\nFeatures: ${d.features}\nAudience: ${d.audience}\n\nProvide the following:\n1. Meta Title (Max 60 chars) - Provide 3 highly clickable options.\n2. Meta Description (Max 155 chars) - Provide 3 options with clear CTR triggers.\n3. Keyword Cluster: 5 Primary Keywords and 10 Long-Tail Keywords (with search intent).\n4. Image Alt-Text Strategy: 5 examples of perfect descriptive alt-tags for product images.\n5. FAQ Schema Content: 3 frequently asked questions with keyword-rich answers that can be used for Google Rich Snippets.`,
    },
    emails: {
        title: '📧 Email Sequence Generator',
        inputTitle: 'Email Campaign Details',
        showFields: ['productName', 'category', 'features', 'audience', 'tone', 'emailType'],
        buildPrompt: (d) =>
            `You are a top-tier Email Marketing Strategist for 8-figure e-commerce brands. Create a high-converting ${d.emailType} email sequence.\n\nProduct/Store: ${d.productName}\nCategory: ${d.category}\nDetails: ${d.features}\nAudience: ${d.audience}\nTone: ${d.tone}\nSequence Type: ${d.emailType}\n\nGenerate a 3-email drip sequence. For EACH email, provide:\n1. 3 Subject Line Options (Include emojis, optimize for open rates)\n2. Preview Text (The hidden text after the subject line)\n3. Email Body (Use psychological triggers, storytelling, personalization like [First Name], and clear formatting)\n4. Call-To-Action (Make it impossible to ignore)\n5. Send Time Delay (e.g., 'Send 24 hours after Email 1')`,
    },
    brandname: {
        title: '💡 Brand Name Generator',
        inputTitle: 'Business Details',
        showFields: ['category', 'audience', 'tone', 'brandInfo'],
        buildPrompt: (d) =>
            `You are a world-class Brand Strategist. Generate creative, memorable brand identity concepts for a new e-commerce business.\n\nNiche: ${d.category}\nTarget Audience: ${d.audience}\nBrand Persona: ${d.tone}\nBusiness Context: ${d.brandInfo || d.features}\n\nProvide 10 unique brand name ideas. For each idea, include:\n1. The Brand Name (Keep it short, 1-2 words ideally)\n2. The Rationale: Why it resonates psychologically with the target audience.\n3. Slogan / Tagline: A punchy 3-5 word memorable hook.\n4. Visual Identity Concept: Brief suggestion for logo style and color palette.\nAvoid generic dropshipping names. Think like a premium direct-to-consumer (DTC) brand.`,
    },
    social: {
        title: '📱 Social Media Content',
        inputTitle: 'Content Details',
        showFields: ['productName', 'category', 'features', 'audience', 'tone', 'platform'],
        buildPrompt: (d) =>
            `You are a Viral Social Media Manager. Create a scroll-stopping content calendar for ${d.platform}.\n\nProduct/Brand: ${d.productName}\nCategory: ${d.category}\nDetails: ${d.features}\nAudience: ${d.audience}\nBrand Voice: ${d.tone}\nPlatform: ${d.platform}\n\nGenerate 5 highly engaging post concepts. For each concept, provide:\n1. Content Format (e.g., POV Video, Educational Carousel, Meme, Aesthetic Photo)\n2. The Visual Hook (What happens in the first 2 seconds to stop the scroll?)\n3. The Caption (Platform-native formatting, emojis, and a clear CTA)\n4. Hashtag Strategy (Mix of broad, niche, and trending tags)\n5. Audio Suggestion (e.g., Trending TikTok sound, calm lo-fi, etc.)`,
    },
};

// ===== DOM =====
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ===== INIT =====
function init() {
    loadSettings();
    setupToolNav();
    setupToneChips();
    setupPlatformChips();
    setupEmailChips();
    setupSettings();
    setupGenerate();
    setupCopy();
    setupMobileMenu();
    updateUsageDisplay();
    switchTool('descriptions');
}

function loadSettings() {
    if (state.apiKey) {
        $('#apiKeyInput').value = state.apiKey;
        updateApiStatus(true);
    }
    $('#modelSelect').value = state.model;
}

function updateApiStatus(online) {
    const dot = $('.status-dot');
    const text = $('.status-text');
    dot.className = `status-dot ${online ? 'online' : 'offline'}`;
    text.textContent = online ? 'Connected' : 'API Key Required';
}

function updateUsageDisplay() {
    const usage = getUsage();
    const countEl = $('#usageCount');
    const fillEl = $('#usageFill');
    if (isPro()) {
        countEl.textContent = '∞';
        fillEl.style.width = '100%';
        fillEl.style.background = 'linear-gradient(90deg, #8b5cf6, #06b6d4)';
    } else {
        countEl.textContent = usage.count;
        const pct = Math.min((usage.count / FREE_LIMIT) * 100, 100);
        fillEl.style.width = pct + '%';
        if (pct >= 80) fillEl.style.background = '#ef4444';
    }
}

// ===== TOOL NAVIGATION =====
function setupToolNav() {
    $$('.sidebar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            switchTool(tool);
        });
    });
}

function switchTool(tool) {
    state.currentTool = tool;
    const config = tools[tool];

    // Update active button
    $$('.sidebar-btn').forEach(b => b.classList.remove('active'));
    $(`[data-tool="${tool}"]`).classList.add('active');

    // Update title
    $('#topbarTitle').textContent = config.title;
    $('#inputTitle').textContent = config.inputTitle;

    // Show/hide fields
    const allFields = ['productName', 'category', 'features', 'audience', 'tone', 'platform', 'emailType', 'brandInfo'];
    allFields.forEach(f => {
        const el = $(`#field-${f}`);
        if (el) el.style.display = config.showFields.includes(f) ? '' : 'none';
    });

    // PRO gating
    const overlay = $('#upgradeOverlay');
    if (PRO_TOOLS.includes(tool) && !isPro()) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }

    // Close mobile sidebar
    $('#sidebar').classList.remove('open');
}

// ===== CHIPS =====
function setupToneChips() {
    $$('.tone-chips:not(#platformChips):not(#emailTypeChips) .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            chip.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.tone = chip.dataset.tone;
        });
    });
}
function setupPlatformChips() {
    $$('#platformChips .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            $$('#platformChips .chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.platform = chip.dataset.platform;
        });
    });
}
function setupEmailChips() {
    $$('#emailTypeChips .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            $$('#emailTypeChips .chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.emailType = chip.dataset.email;
        });
    });
}

// ===== SETTINGS =====
function setupSettings() {
    $('#settingsBtn').addEventListener('click', () => $('#settingsModal').classList.add('active'));
    $('#closeSettings').addEventListener('click', () => $('#settingsModal').classList.remove('active'));
    $('#settingsModal').addEventListener('click', (e) => { if (e.target === $('#settingsModal')) $('#settingsModal').classList.remove('active'); });

    $('#saveSettings').addEventListener('click', () => {
        state.apiKey = $('#apiKeyInput').value.trim();
        state.model = $('#modelSelect').value;
        localStorage.setItem('ecomgenius_apiKey', state.apiKey);
        localStorage.setItem('ecomgenius_model', state.model);
        updateApiStatus(!!state.apiKey);
        $('#settingsModal').classList.remove('active');
    });
}

// ===== MOBILE =====
function setupMobileMenu() {
    const btn = $('#mobileMenuBtn');
    if (btn) btn.addEventListener('click', () => $('#sidebar').classList.toggle('open'));
}

// ===== GENERATION =====
function setupGenerate() {
    $('#generateBtn').addEventListener('click', generate);
    $('#regenerateBtn').addEventListener('click', generate);
}

async function generate() {
    if (state.generating) return;
    if (!state.apiKey) {
        $('#settingsModal').classList.add('active');
        return;
    }

    // Check pro gating
    if (PRO_TOOLS.includes(state.currentTool) && !isPro()) {
        if (typeof openLicenseModal === 'function') openLicenseModal();
        return;
    }

    // Check usage limit
    if (!canGenerate()) {
        showError(`You've used all ${FREE_LIMIT} free generations this month. Upgrade to Pro for unlimited access!`);
        if (typeof openLicenseModal === 'function') setTimeout(openLicenseModal, 1500);
        return;
    }

    const config = tools[state.currentTool];
    const data = {
        productName: $('#productName')?.value?.trim() || '',
        category: $('#category')?.value?.trim() || '',
        features: $('#features')?.value?.trim() || '',
        audience: $('#audience')?.value?.trim() || '',
        tone: state.tone,
        platform: state.platform,
        emailType: state.emailType,
        brandInfo: $('#brandInfo')?.value?.trim() || '',
    };

    // Validate
    if (!data.productName && !data.features && !data.brandInfo) {
        showError('Please fill in at least the product name or key features.');
        return;
    }

    const prompt = config.buildPrompt(data);
    setLoading(true);
    hideAll();

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'EcomGenius',
            },
            body: JSON.stringify({
                model: state.model,
                messages: [
                    { role: 'system', content: 'You are an expert e-commerce copywriter and marketing strategist. You write compelling, conversion-optimized content that drives sales. Format your output with clear headers, bullet points, and sections using markdown.' },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 2000,
                temperature: 0.8,
                stream: true,
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `API error: ${response.status}`);
        }

        $('#outputText').innerHTML = '<span class="typing-cursor">|</span>';
        $('#outputContent').style.display = '';
        let generatedText = '';

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\\n');

            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const content = data.choices[0]?.delta?.content || '';
                        generatedText += content;
                        $('#outputText').innerHTML = markdownToHtml(generatedText) + '<span class="typing-cursor">|</span>';
                        
                        const outputArea = document.querySelector('.output-panel .panel-body');
                        if (outputArea) outputArea.scrollTop = outputArea.scrollHeight;
                    } catch (e) {
                        // ignore parse errors for incomplete chunks
                    }
                }
            }
        }

        // Remove cursor when done
        $('#outputText').innerHTML = markdownToHtml(generatedText);
        $('#copyBtn').style.display = '';
        $('#regenerateBtn').style.display = '';

        // Track usage
        incrementUsage();
        if (typeof Analytics !== 'undefined') Analytics.trackGeneration(state.currentTool);
    } catch (err) {
        showError(err.message || 'Failed to generate content. Check your API key.');
    } finally {
        setLoading(false);
    }
}

function setLoading(loading) {
    state.generating = loading;
    const btn = $('#generateBtn');
    btn.querySelector('.btn-text').style.display = loading ? 'none' : '';
    btn.querySelector('.btn-loading').style.display = loading ? 'flex' : 'none';
    btn.disabled = loading;
}

function hideAll() {
    $('#outputPlaceholder').style.display = 'none';
    $('#outputContent').style.display = 'none';
    $('#outputError').style.display = 'none';
    $('#copyBtn').style.display = 'none';
    $('#regenerateBtn').style.display = 'none';
}

function showOutput(text) {
    hideAll();
    const html = markdownToHtml(text);
    $('#outputText').innerHTML = html;
    $('#outputContent').style.display = '';
    $('#copyBtn').style.display = '';
    $('#regenerateBtn').style.display = '';
}

function showError(msg) {
    hideAll();
    $('#errorText').textContent = msg;
    $('#outputError').style.display = '';
    $('#regenerateBtn').style.display = '';
}

// ===== COPY =====
function setupCopy() {
    $('#copyBtn').addEventListener('click', () => {
        const text = $('#outputText').innerText;
        navigator.clipboard.writeText(text).then(() => {
            const btn = $('#copyBtn');
            btn.textContent = '✅ Copied!';
            setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
        });
    });
}

// ===== SIMPLE MARKDOWN PARSER =====
function markdownToHtml(md) {
    let html = md
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
        .replace(/\n{2,}/g, '</p><p>')
        .replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);
    return html;
}

// ===== START =====
document.addEventListener('DOMContentLoaded', init);
