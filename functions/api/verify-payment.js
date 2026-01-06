import Stripe from 'stripe';
import { Resend } from 'resend';

export async function onRequestPost({ request, env }) {
    try {
        if (!env.STRIPE_SECRET_KEY) {
            throw new Error('Missing STRIPE_SECRET_KEY environment variable');
        }
        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-01-27.acacia',
            httpClient: Stripe.createFetchHttpClient(),
        });
        const { session_id } = await request.json();

        if (!session_id) {
            return new Response(JSON.stringify({ error: 'Missing session_id' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status === 'paid') {
            // Generate a real license key
            const licenseKey = 'PRO-' + Math.random().toString(36).substring(2, 14).toUpperCase();

            // Insert into D1
            const result = await env.DB.prepare(
                `INSERT INTO licenses (key, type, domain, quota_limit, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?)`
            ).bind(licenseKey, 'PRO', null, 999999, 1, new Date().toISOString()).run();

            if (!result.success) {
                throw new Error('Failed to create license in database');
            }

            // Send Email
            if (env.RESEND_API_KEY) {
                const resend = new Resend(env.RESEND_API_KEY);
                await resend.emails.send({
                    from: 'Invent2025 <no-reply@invent2025.org>',
                    to: session.customer_details.email, // Stripe ensures this exists
                    subject: 'Your PRO License Key',
                    html: `
                        <h1>Thank you for your purchase!</h1>
                        <p>Here is your PRO License Key for the <strong>BGN to EUR Transition Plugin</strong>:</p>
                        <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 20px; text-align: center; margin: 20px 0;">
                            ${licenseKey}
                        </div>
                        <p><strong>Instructions:</strong></p>
                        <ol>
                            <li>Go to your WordPress Admin Dashboard.</li>
                            <li>Navigate to <strong>Settings > BGN Converter</strong>.</li>
                            <li>Enter the key above in the "License Key" field.</li>
                            <li>Click "Activate".</li>
                        </ol>
                        <p>If you have any questions, contact us at <a href="mailto:contact@invent2025.org">contact@invent2025.org</a>.</p>
                        <p>Regards,<br>Invent2025 Team</p>
                    `
                });
            }

            return new Response(
                JSON.stringify({
                    verified: true,
                    key: licenseKey,
                    email: session.customer_details.email,
                }),
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        } else {
            return new Response(JSON.stringify({ error: 'Payment not successful' }), {
                status: 402,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
