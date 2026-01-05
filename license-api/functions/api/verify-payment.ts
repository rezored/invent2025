import Stripe from 'stripe';
import { Resend } from 'resend';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    // Initialize
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    const resend = new Resend(env.RESEND_API_KEY);

    try {
        const { session_id } = await request.json() as { session_id: string };

        if (!session_id) {
            return new Response('Missing session_id', { status: 400 });
        }

        // 1. Verify with Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status !== 'paid') {
            return new Response('Payment not completed', { status: 400 });
        }

        // 2. Check if already fulfilled (Optional: Check DB if session_id exists to prevent dupes)
        // For now, we will just generate a new one or return existing if we were to implement idempotency fully.
        // Simpler: Check if session_id is in DB.
        const existing = await env.DB.prepare('SELECT key FROM licenses WHERE stripe_session_id = ?').bind(session_id).first();
        if (existing) {
            return new Response(JSON.stringify({ key: existing.key, email: session.customer_details?.email }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. Generate API Key
        // Format: inv_live_[random_hex]
        const randomHex = crypto.randomUUID().replace(/-/g, '') + crypto.getRandomValues(new Uint8Array(4)).reduce((acc, x) => acc + x.toString(16).padStart(2, '0'), '');
        const apiKey = `inv_live_${randomHex}`;
        const email = session.customer_details?.email || 'unknown@example.com';

        // 4. Save to DB
        await env.DB.prepare(
            'INSERT INTO licenses (key, stripe_customer_id, stripe_session_id, email, type, quota_limit) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(apiKey, session.customer, session.id, email, 'PRO', 1000000) // Unlimited-ish
            .run();

        // 5. Send Email
        try {
            await resend.emails.send({
                from: 'Invent2025 <license@invent2025.org>', // Needs verified domain
                to: [email],
                subject: 'Your Invent2025 License Key',
                html: `
                <h1>Thank you for your purchase!</h1>
                <p>Here is your API key for the BGN-EUR Converter:</p>
                <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;">${apiKey}</pre>
                <p>Keep this key secret.</p>
                <p>Invent2025 Team</p>
            `
            });
        } catch (emailErr) {
            console.error('Failed to send email:', emailErr);
            // Don't fail the request if email fails, just log it. The user sees the key on screen.
        }

        return new Response(JSON.stringify({ key: apiKey, email }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

interface Env {
    STRIPE_SECRET_KEY: string;
    RESEND_API_KEY: string;
    DB: D1Database;
}
