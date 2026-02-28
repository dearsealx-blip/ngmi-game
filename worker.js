/**
 * NGMI Telegram Bot - Cloudflare Worker
 * Handles webhook updates and referral link routing for the NGMI Mini App.
 */

const BOT_TOKEN = '8733328088:AAE2CMtfiAL5RHU1jE6uUNnP7-tJ4h6pLAE';
const MINI_APP_URL = 'https://dearsealx-blip.github.io/ngmi-game/';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Health check
    if (request.method === 'GET' && url.pathname === '/') {
      return json({ ok: true });
    }

    // Set webhook helper
    if (request.method === 'GET' && url.pathname === '/set-webhook') {
      const workerUrl = url.searchParams.get('url');
      if (!workerUrl) {
        return json({ ok: false, error: 'Missing ?url= parameter' }, 400);
      }
      const result = await callTelegram('setWebhook', { url: workerUrl });
      return json(result);
    }

    // Telegram webhook
    if (request.method === 'POST' && url.pathname === '/') {
      let update;
      try {
        update = await request.json();
      } catch {
        return json({ ok: false, error: 'Invalid JSON' }, 400);
      }
      await handleUpdate(update);
      return json({ ok: true });
    }

    return json({ ok: false, error: 'Not found' }, 404);
  },
};

// ---------------------------------------------------------------------------
// Update handler
// ---------------------------------------------------------------------------

async function handleUpdate(update) {
  const message = update?.message;
  if (!message) return;

  const text = message.text ?? '';
  const chatId = message.chat.id;
  const firstName = message.from?.first_name ?? 'fren';

  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    const payload = parts[1] ?? ''; // e.g. "ref_USERNAME" or ""

    let appUrl = MINI_APP_URL;
    let welcomeText;

    if (payload.startsWith('ref_')) {
      const referrer = payload.slice(4); // strip "ref_"
      appUrl = `${MINI_APP_URL}?ref=${encodeURIComponent(referrer)}`;
      welcomeText =
        `👋 Welcome, ${firstName}!\n\n` +
        `You were invited by <b>${referrer}</b>. 🎉\n\n` +
        `Tap below to start playing NGMI and earn together! 🐸`;
    } else {
      welcomeText =
        `👋 Welcome, ${firstName}!\n\n` +
        `Ready to play NGMI? Tap below to launch the game! 🐸`;
    }

    await callTelegram('sendMessage', {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🐸 PLAY NGMI',
              web_app: { url: appUrl },
            },
          ],
        ],
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function callTelegram(method, body) {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
