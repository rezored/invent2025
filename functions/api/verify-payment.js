import Stripe from 'stripe';
import { createLicense } from './_utils/license-service.js';

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
            const result = await createLicense({
                env,
                sessionId: session.id,
                customerEmail: session.customer_details?.email,
                customerId: session.customer,
            });

            return new Response(
                JSON.stringify({
                    verified: true,
                    key: result.key,
                    email: session.customer_details?.email,
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

