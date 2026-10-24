// POST /api/enquiry — website enquiry → Telegram notification (Cloudflare Pages Function)
// Required env (Pages project → Settings → Environment variables):
//   TELEGRAM_BOT_TOKEN  (secret)
//   TELEGRAM_CHAT_ID    (e.g. 8915939185)
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map();

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const esc = value => String(value).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (list.length >= MAX_REQUESTS) return true;
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 1000) hits.clear();
  return false;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== url.host) return json({ ok: false, error: 'bad_origin' }, 403);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (rateLimited(ip)) return json({ ok: false, error: 'rate_limited' }, 429);

  let data;
  try {
    if ((request.headers.get('content-type') || '').includes('application/json')) {
      data = await request.json();
    } else {
      data = Object.fromEntries((await request.formData()).entries());
    }
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }
  if (!data || typeof data !== 'object') return json({ ok: false, error: 'bad_request' }, 400);

  const v = key => String(data[key] ?? '').trim();
  const name = v('name'), email = v('email'), business = v('business');
  const phone = v('phone'), plan = v('plan'), message = v('message'), website = v('website');

  if (website) return json({ ok: true }); // honeypot: silently accept bots
  if (!name || !email || !message) return json({ ok: false, error: 'missing_fields' }, 400);
  if (name.length > 120 || email.length > 200 || business.length > 200 || phone.length > 80 || plan.length > 80 || message.length > 4000) {
    return json({ ok: false, error: 'too_long' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'bad_email' }, 400);

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ ok: false, error: 'not_configured' }, 503);

  const text = [
    '🌐 Website enquiry',
    '',
    `👤 ${esc(name)}${business ? ` · ${esc(business)}` : ''}`,
    `✉️ ${esc(email)}`,
    phone ? `📱 ${esc(phone)}` : '',
    plan ? `📋 ${esc(plan)}` : '',
    '',
    esc(message.slice(0, 3000)),
    '',
    '— emrys-ebs.pages.dev/contact',
  ].filter(line => line !== '').join('\n');

  const tg = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
  });
  if (!tg.ok) return json({ ok: false, error: 'delivery_failed' }, 502);
  return json({ ok: true });
}

export async function onRequestGet() {
  return json({ ok: false, error: 'method_not_allowed' }, 405);
}
