interface Env {
  DB: D1Database;
}

interface ConversionItem {
  id: number;
  regular_price?: number;
  sale_price?: number;
}

interface ProcessRequest {
  api_key?: string; // Optional for Free Tier
  site_url: string;
  items: ConversionItem[];
  rounding_rule: string;
}

interface License {
  key: string;
  quota_limit: number;
  is_active: number;
  type: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ allowed: false, message: "Method Not Allowed" }), { status: 405 });
  }

  try {
    const body: ProcessRequest = await request.json();
    const clientIP = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
    const requestedCount = body.items.length;

    // 1. Identify / Provision License
    let license: License | null = null;
    let finalKey = body.api_key;

    if (!body.api_key || body.api_key === "FREE") {
      // FREE TIER LOGIC: Check if domain exists
      const existing = await env.DB.prepare("SELECT * FROM licenses WHERE domain = ? AND type = 'FREE'")
        .bind(body.site_url)
        .first<License>();

      if (existing) {
        license = existing;
        finalKey = existing.key;
      } else {
        // Auto-provision new Free License
        finalKey = `FREE-${crypto.randomUUID().substring(0, 8)}`;
        await env.DB.prepare("INSERT INTO licenses (key, quota_limit, type, domain, is_active) VALUES (?, 20, 'FREE', ?, 1)")
          .bind(finalKey, body.site_url)
          .run();

        license = { key: finalKey, quota_limit: 20, is_active: 1, type: 'FREE' };
      }
    } else {
      // PRO LOGIC
      license = await env.DB.prepare("SELECT * FROM licenses WHERE key = ?").bind(body.api_key).first<License>();
      if (!license || !license.is_active) {
        return new Response(JSON.stringify({ allowed: false, message: "Invalid License Key" }), {
          status: 403,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // 2. Check Quota (Skip for PRO/Unlimited)
    const usageResult = await env.DB.prepare("SELECT SUM(items_processed) as total_usage FROM usage_logs WHERE license_key = ?")
      .bind(license.key)
      .first<{ total_usage: number }>();

    const currentUsage = usageResult?.total_usage || 0;

    // Only enforce limit if NOT PRO (or identify specific types)
    if (license.type !== 'PRO' && (currentUsage + requestedCount > license.quota_limit)) {
      return new Response(JSON.stringify({ allowed: false, message: "Quota Exceeded" }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 3. Perform Logic (The "Magic")
    const RATE = 1.95583;
    const results = body.items.map(item => {
      return {
        id: item.id,
        new_regular: item.regular_price ? applyRounding(item.regular_price / RATE, body.rounding_rule) : null,
        new_sale: item.sale_price ? applyRounding(item.sale_price / RATE, body.rounding_rule) : null,
      };
    });

    // 4. Log Usage
    await env.DB.prepare("INSERT INTO usage_logs (license_key, items_processed, ip_address) VALUES (?, ?, ?)")
      .bind(license.key, requestedCount, clientIP)
      .run();

    return new Response(JSON.stringify({
      allowed: true,
      message: "OK",
      results: results,
      remaining: license.quota_limit - (currentUsage + requestedCount)
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ allowed: false, message: `Internal Error: ${String(err)}` }), { status: 500 });
  }
};

function applyRounding(val: number, rule: string): number {
  if (rule === 'math') return Math.round(val * 100) / 100;
  if (rule === '0.05') return Math.round(val * 20) / 20;
  if (rule === '0.10') return Math.round(val * 10) / 10;
  if (rule === '0.50') return Math.round(val * 2) / 2;
  if (rule === '1.00') return Math.round(val);
  if (rule === 'ceil') return Math.ceil(val);
  if (rule === '5.00') return Math.ceil(val / 5) * 5;
  return Math.round(val * 100) / 100;
}
