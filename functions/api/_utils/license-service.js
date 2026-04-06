import { Resend } from 'resend';

export async function createLicense({ env, sessionId, customerEmail, customerId }) {
    // 1. Check if license already exists for this session to prevent duplicates
    const existing = await env.DB.prepare(
        "SELECT key FROM licenses WHERE stripe_session_id = ?"
    ).bind(sessionId).first();

    if (existing) {
        return { success: true, key: existing.key, alreadyExists: true };
    }

    // 2. Generate license key
    const licenseKey = 'PRO-' + Math.random().toString(36).substring(2, 14).toUpperCase();

    // 3. Insert into D1
    // We include email, stripe_customer_id and stripe_session_id from the latest migrations
    const result = await env.DB.prepare(
        `INSERT INTO licenses (key, type, quota_limit, is_active, created_at, email, stripe_customer_id, stripe_session_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        licenseKey, 
        'PRO', 
        1000000, 
        1, 
        new Date().toISOString(), 
        customerEmail, 
        customerId, 
        sessionId
    ).run();

    if (!result.success) {
        throw new Error('Database insertion failed');
    }

    // 4. Send Email via Resend
    if (env.RESEND_API_KEY && customerEmail) {
        const resend = new Resend(env.RESEND_API_KEY);
        try {
            await resend.emails.send({
                from: 'Invent2025 <no-reply@invent2025.org>',
                to: customerEmail,
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
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // We don't throw here because the license was already created in DB
        }
    }

    return { success: true, key: licenseKey };
}
