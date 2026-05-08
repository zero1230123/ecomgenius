// Vercel Serverless Function — Gumroad License Key Verification
// POST /api/verify-license
// Body: { license_key: "XXXXX-XXXXX-XXXXX-XXXXX", product_permalink: "tqytir" }

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { license_key, product_permalink } = req.body;

    if (!license_key || !product_permalink) {
        return res.status(400).json({
            success: false,
            message: 'Missing license_key or product_permalink'
        });
    }

    try {
        const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                product_id: product_permalink,
                license_key: license_key,
                increment_uses_count: 'false'
            })
        });

        const data = await response.json();

        if (data.success) {
            return res.status(200).json({
                success: true,
                plan: data.purchase?.variants ? 'agency' : 'pro',
                email: data.purchase?.email || '',
                license_key: license_key,
                product_name: data.purchase?.product_name || 'EcomGenius Pro',
                created_at: data.purchase?.created_at || '',
            });
        } else {
            return res.status(200).json({
                success: false,
                message: data.message || 'Invalid license key'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Verification service unavailable. Please try again.'
        });
    }
}
