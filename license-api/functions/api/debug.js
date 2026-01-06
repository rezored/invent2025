export function onRequest(context) {
    const { env } = context;
    const keys = Object.keys(env);
    const stripeStatus = env.STRIPE_SECRET_KEY ?
        `Present (starts with ${env.STRIPE_SECRET_KEY.substring(0, 4)}...)` :
        "MISSING";

    return new Response(JSON.stringify({
        envKeys: keys,
        stripeSecretKey: stripeStatus,
        NODE_ENV: env.NODE_ENV || 'undefined'
    }, null, 2), {
        headers: { "Content-Type": "application/json" }
    });
}
