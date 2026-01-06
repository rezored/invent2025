const express = require('express');
const stripe = require('stripe');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load env variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4242;

// Parse JSON bodies (as sent by API clients)
// We need raw body for webhook signing
app.use((req, res, next) => {
    if (req.originalUrl === '/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

app.use(cors());

// serve static files
const staticDir = process.env.STATIC_DIR || '.';
app.use(express.static(path.resolve(__dirname, staticDir)));

// Initialize Stripe
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Domain
const YOUR_DOMAIN = process.env.BASE_URL || `http://localhost:${PORT}`;

app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const session = await stripeClient.checkout.sessions.create({
            line_items: [
                {
                    // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                    // OR define price data inline
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Prices in BGN and EUR (PRO License)',
                            description: 'Unlimited conversions and priority support.',
                            images: [`${YOUR_DOMAIN}/invent_2025_logo_icon.svg`], // Optional
                        },
                        unit_amount: 1999, // 19.99 EUR
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${YOUR_DOMAIN}/products/bgn-to-euro-transition.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${YOUR_DOMAIN}/products/bgn-to-euro-transition.html?canceled=true`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/verify-payment', async (req, res) => {
    const { session_id } = req.body;

    if (!session_id) {
        return res.status(400).json({ error: 'Missing session_id' });
    }

    try {
        const session = await stripeClient.checkout.sessions.retrieve(session_id);

        if (session.payment_status === 'paid') {
            // Generate a dummy license key
            // In a real app, you'd save this to a DB linked to session.customer_email
            const licenseKey = 'PRO-' + Math.random().toString(36).substring(2, 15).toUpperCase();

            res.json({
                verified: true,
                key: licenseKey,
                email: session.customer_details.email
            });
        } else {
            res.status(402).json({ error: 'Payment not successful' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {
    const sig = request.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (endpointSecret) {
            event = stripeClient.webhooks.constructEvent(request.body, sig, endpointSecret);
        } else {
            // If no secret, blindly trust (NOT FOR PRODUCTION)
            event = JSON.parse(request.body);
        }
    } catch (err) {
        console.log(`Webhook Error: ${err.message}`);
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log(`Payment successful for session: ${session.id}`);
            // Fulfill the purchase...
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
