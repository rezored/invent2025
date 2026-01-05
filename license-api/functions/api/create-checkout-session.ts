import Stripe from 'stripe';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    // Initialize Stripe
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16', // Use a recent API version
    });

    try {
        // Determine domain from request
        const url = new URL(request.url);
        const origin = url.origin; // e.g., https://your-site.pages.dev

        // 1. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'BGN to EUR Transition Plugin (Pro)',
                            description: 'Unlimited conversions and priority support.',
                        },
                        unit_amount: 4900, // 49.00 EUR in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/products/bgn-to-euro-transition.html?session_id={CHECKOUT_SESSION_ID}&payment_success=true`,
            cancel_url: `${origin}/products/bgn-to-euro-transition.html?payment_canceled=true`,
            metadata: {
                product: 'bgn_plugin',
            }
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

interface Env {
    STRIPE_SECRET_KEY: string;
}
