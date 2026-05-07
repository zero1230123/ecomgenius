// ===== STATE =====
const state = {
    apiKey: localStorage.getItem('ecomgenius_apiKey') || '',
    model: localStorage.getItem('ecomgenius_model') || 'anthropic/claude-3.5-sonnet',
    currentTool: 'descriptions',
    usage: parseInt(localStorage.getItem('ecomgenius_usage') || '0'),
    tone: 'professional',
    platform: 'facebook',
    emailType: 'welcome',
    generating: false,
};

// ===== TOOL CONFIG =====
const tools = {
    descriptions: {
        title: '📝 Product Description Generator',
        inputTitle: 'Product Details',
        showFields: ['productName', 'category', 'features', 'audience', 'tone'],
        buildPrompt: (d) =>
            `Write a compelling, SEO-optimized product description for an e-commerce listing.\n\nProduct: ${d.productName}\nCategory: ${d.category}\nKey Features: ${d.features}\nTarget Audience: ${d.audience}\nTone: ${d.tone}\n\nCreate a description that:\n1. Starts with an attention-grabbing headline\n2. Highlights key benefits (not just features)\n3. Uses emotional triggers and power words\n4. Includes a clear call-to-action\n5. Is formatted with bullet points for scanability\n6. Is SEO-friendly with natural keyword placement\n\nProvide 2 versions: a short version (50 words) and a detailed version (150-200 words).`,
    },
    adcopy: {
        title: '📢 Ad Copy Generator',
        inputTitle: 'Ad Details',
        showFields: ['productName', 'category', 'features', 'audience', 'tone', 'platform'],
        buildPrompt: (d) =>
            `Create high-converting ad copy for ${d.platform} ads.\n\nProduct: ${d.productName}\nCategory: ${d.category}\nKey Features: ${d.features}\nTarget Audience: ${d.audience}\nTone: ${d.tone}\nPlatform: ${d.platform}\n\nGenerate 3 ad variations, each with:\n1. Headline (max ${d.platform === 'google' ? '30' : '40'} chars)\n2. Primary text / body copy\n3. Call-to-action\n4. Suggested hashtags (if applicable)\n\nFocus on ROAS optimization with emotional triggers, urgency, and clear value propositions.`,
    },
    seo: {
        title: '🔍 SEO Optimizer',
        inputTitle: 'Product / Page Details',
        showFields: ['productName', 'category', 'features', 'audience'],
        buildPrompt: (d) =>
            `Generate comprehensive SEO content for an e-commerce product page.\n\nProduct: ${d.productName}\nCategory: ${d.category}\nFeatures: ${d.features}\nAudience: ${d.audience}\n\nProvide:\n1. Meta Title (60 chars max) — 3 options\n2. Meta Description (155 chars max) — 3 options\n3. Top 10 Target Keywords (with estimated search intent)\n4. 5 Long-tail Keywords\n5. Image Alt Tags — 5 suggestions\n6. URL Slug suggestion\n7. Brief SEO-optimized product intro paragraph (100 words)`,
    },
    emails: {
        title: '📧 Email Sequence Generator',
        inputTitle: 'Email Campaign Details',
        showFields: ['productName', 'category', 'features', 'audience', 'tone', 'emailType'],
        buildPrompt: (d) =>
            `Create a ${d.emailType} email sequence for an e-commerce store.\n\nProduct/Store: ${d.productName}\nCategory: ${d.category}\nDetails: ${d.features}\nAudience: ${d.audience}\nTone: ${d.tone}\nSequence Type: ${d.emailType}\n\nGenerate a 3-email sequence. For each email provide:\n1. Subject Line (with emoji)\n2. Preview Text\n3. Email Body (formatted with headers, paragraphs, CTA buttons)\n4. Best send time recommendation\n\nFocus on conversions with personalization tokens like [First Name].`,
    },
    brandname: {
        title: '💡 Brand Name Generator',
        inputTitle: 'Business Details',
        showFields: ['category', 'audience', 'tone', 'brandInfo'],
        buildPrompt: (d) =>
            `Generate creative brand name ideas for a new e-commerce business.\n\nCategory/Niche: ${d.category}\nTarget Audience: ${d.audience}\nTone/Style: ${d.tone}\nBusiness Description: ${d.brandInfo || d.features}\n\nGenerate 10 brand name ideas. For each:\n1. Brand Name\n2. Why it works (1 line)\n3. Domain availability suggestion (.com, .co, .io)\n4. Tagline idea\n5. Logo concept (brief visual description)\n\nInclude a mix of: invented words, compound words, metaphors, and acronyms. Make them memorable, easy to pronounce, and globally friendly.`,
    },
    social: {
        title: '📱 Social Media Content',
        inputTitle: 'Content Details',
        showFields: ['productName', 'category', 'features', 'audience', 'tone', 'platform'],
        buildPrompt: (d) =>
            `Create viral social media content for ${d.platform}.\n\nProduct/Brand: ${d.productName}\nCategory: ${d.category}\nDetails: ${d.features}\nAudience: ${d.audience}\nTone: ${d.tone}\nPlatform: ${d.platform}\n\nGenerate 5 post ideas. For each:\n1. Caption/copy (platform-optimized length)\n2. Content type (reel, carousel, story, static post)\n3. Visual concept description\n4. 15 relevant hashtags (mix of volume levels)\n5. Best posting time\n6. Engagement hook / CTA\n\nMake content that stops the scroll and drives engagement.`,
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
    $('#usageCount').textContent = state.usage;
    const pct = Math.min((state.usage / 5) * 100, 100);
    $('#usageFill').style.width = pct + '%';
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
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `API error: ${response.status}`);
        }

        const result = await response.json();
        const text = result.choices?.[0]?.message?.content || 'No content generated.';

        showOutput(text);
        state.usage++;
        localStorage.setItem('ecomgenius_usage', state.usage.toString());
        updateUsageDisplay();
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
    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);
    return html;
}

// ===== START =====
document.addEventListener('DOMContentLoaded', init);
