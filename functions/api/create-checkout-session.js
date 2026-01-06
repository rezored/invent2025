import Stripe from 'stripe';

export async function onRequestPost({ request, env }) {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const url = new URL(request.url);
    const domain = url.origin;

    try {
        // You can read the body if needed, e.g. for quantity
        // const body = await request.json();

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Prices in BGN and EUR (PRO License)',
                            description: 'Unlimited conversions and priority support.',
                            images: [`${domain}/invent_2025_logo_icon.svg`],
                        },
                        unit_amount: 1999, // 19.99 EUR
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${domain}/products/bgn-to-euro-transition.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${domain}/products/bgn-to-euro-transition.html?canceled=true`,
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
