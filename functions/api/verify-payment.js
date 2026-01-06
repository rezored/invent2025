import Stripe from 'stripe';

export async function onRequestPost({ request, env }) {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);

    try {
        const { session_id } = await request.json();

        if (!session_id) {
            return new Response(JSON.stringify({ error: 'Missing session_id' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status === 'paid') {
            // Generate a dummy license key
            // Store in KV or D1 in a real app
            const licenseKey = 'PRO-' + Math.random().toString(36).substring(2, 15).toUpperCase();

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
