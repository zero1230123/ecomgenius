// ===== Google Analytics 4 — EcomGenius =====
// Replace 'G-XXXXXXXXXX' with your actual GA4 Measurement ID
// Get one free at: https://analytics.google.com

(function() {
    const GA_ID = 'G-XXXXXXXXXX'; // ← PUT YOUR GA4 ID HERE

    if (GA_ID === 'G-XXXXXXXXXX') {
        console.log('[Analytics] No GA4 ID configured. Skipping analytics.');
        return;
    }

    // Load gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);
})();

// ===== Custom Event Tracking =====
const Analytics = {
    // Track tool usage
    trackGeneration(toolName) {
        if (window.gtag) {
            gtag('event', 'generate_content', {
                event_category: 'AI Tools',
                event_label: toolName,
            });
        }
    },

    // Track upgrade clicks
    trackUpgradeClick(source) {
        if (window.gtag) {
            gtag('event', 'upgrade_click', {
                event_category: 'Conversion',
                event_label: source,
            });
        }
    },

    // Track license activation
    trackLicenseActivation(plan) {
        if (window.gtag) {
            gtag('event', 'license_activated', {
                event_category: 'Conversion',
                event_label: plan,
            });
        }
    },

    // Track page view with custom data
    trackPageView(pageName) {
        if (window.gtag) {
            gtag('event', 'page_view', {
                page_title: pageName,
            });
        }
    },

    // Track blog article read
    trackBlogRead(articleTitle) {
        if (window.gtag) {
            gtag('event', 'blog_read', {
                event_category: 'Content',
                event_label: articleTitle,
            });
        }
    },

    // Track email signup
    trackEmailSignup(source) {
        if (window.gtag) {
            gtag('event', 'email_signup', {
                event_category: 'Lead',
                event_label: source,
            });
        }
    }
};
