interface Env {
    DB: D1Database;
    ADMIN_SECRET: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    // Security Check
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, x-admin-secret",
            }
        });
    }

    const secret = request.headers.get("x-admin-secret");
    const configuredSecret = env.ADMIN_SECRET || "default-secret-change-me"; // Fallback for dev

    if (secret !== configuredSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Access-Control-Allow-Origin": "*" } // meaningful error
        });
    }

    // Handle GET: List Licenses with Usage
    if (request.method === "GET") {
        const licenses = await env.DB.prepare(`
      SELECT l.*, SUM(u.items_processed) as total_usage
      FROM licenses l
      LEFT JOIN usage_logs u ON l.key = u.license_key
      GROUP BY l.key
      ORDER BY l.created_at DESC
    `).all();

        return new Response(JSON.stringify(licenses.results), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // Handle POST: Create License
    if (request.method === "POST") {
        try {
            const body = await request.json() as any;
            const type = body.type || 'PRO';

            // Generate Key
            const key = `${type}-${crypto.randomUUID().substring(0, 18)}`;
            const domain = body.domain || null;
            const limit = body.quota_limit || (type === 'PRO' ? 1000000 : 20);

            await env.DB.prepare("INSERT INTO licenses (key, quota_limit, type, domain, is_active) VALUES (?, ?, ?, ?, 1)")
                .bind(key, limit, type, domain)
                .run();

            return new Response(JSON.stringify({ success: true, key: key, type: type, domain: domain }), {
                headers: { "Content-Type": "application/json" }
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
        }
    }

    return new Response(null, { status: 405 });
};
