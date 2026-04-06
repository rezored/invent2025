import Stripe from 'stripe';
import { createLicense } from '../_utils/license-service.js';

export async function onRequestPost({ request, env }) {
    const signature = request.headers.get('stripe-signature');
    if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
        return new Response(JSON.stringify({ error: 'Missing signature or webhook secret' }), { status: 400 });
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-01-27.acacia',
        httpClient: Stripe.createFetchHttpClient(),
    });

    let event;
    try {
        const body = await request.text();
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        try {
            await createLicense({
                env,
                sessionId: session.id,
                customerEmail: session.customer_details?.email,
                customerId: session.customer,
            });
        } catch (err) {
            console.error('Webhook failed to create license:', err);
            return new Response(JSON.stringify({ error: 'Failed to create license' }), { status: 500 });
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}
