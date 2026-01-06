import { translations } from './locales.mjs';

let currentLang = 'en';

function updateContent() {
    const t = translations[currentLang];

    // Update simple text elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.innerHTML = t[key];
        }
    });

    // Update specific attributes if needed (e.g. placeholders)
}

async function handleBuy() {
    const btn = document.getElementById('btn-buy-pro');
    const originalText = btn.textContent;
    btn.textContent = translations[currentLang].payment_process;
    btn.disabled = true;

    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref') || 'direct';
    const domainHint = urlParams.get('domain') || '';

    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: ref, domain: domainHint })
        });
        const data = await response.json();

        if (data.url) {
            window.location.href = data.url;
        } else {
            console.error('Payment Error:', data);
            alert('Error starting payment: ' + (data.error || 'Unknown error'));
            btn.textContent = originalText;
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        alert('Error connecting to payment server');
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function verifyPayment(sessionId) {
    const modal = document.getElementById('payment-modal');
    const statusEl = document.getElementById('payment-status');
    const keyEl = document.getElementById('payment-key-display');
    const loader = document.getElementById('payment-loader');

    modal.classList.remove('hidden');
    statusEl.textContent = translations[currentLang].payment_verify;

    try {
        const res = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
        });

        if (!res.ok) throw new Error('Verification failed');

        const data = await res.json();

        loader.classList.add('hidden');
        statusEl.textContent = translations[currentLang].payment_success_title;
        document.getElementById('payment-success-msg').textContent = translations[currentLang].payment_success_msg;
        document.getElementById('payment-email-msg').textContent = translations[currentLang].payment_email_sent;

        keyEl.textContent = data.key;
        keyEl.classList.remove('hidden');

    } catch (e) {
        loader.classList.add('hidden');
        statusEl.textContent = translations[currentLang].payment_error;
        console.error(e);
    }
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'bg' : 'en';
    updateContent();
    document.getElementById('lang-toggle-text').textContent = currentLang.toUpperCase();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Bind Language Toggle
    const langBtn = document.getElementById('lang-btn');
    if (langBtn) {
        langBtn.addEventListener('click', toggleLanguage);
    }

    // Bind Buy Button
    const buyBtn = document.getElementById('btn-buy-pro');
    if (buyBtn) {
        buyBtn.addEventListener('click', handleBuy);
    }

    // Check for payment return
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
        verifyPayment(sessionId);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});
