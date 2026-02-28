// NGMI Wallet Poller
// Runs every 5 minutes via cron
// Checks NGMI bot for wallet replies from winners, forwards to Seal

const https = require('https');
const fs = require('fs');
const path = require('path');

const NGMI_BOT = '8733328088:AAE2CMtfiAL5RHU1jE6uUNnP7-tJ4h6pLAE';
const AGENT_BOT = '8548781901:AAHagzikMuTd9bfSYKjvPNWyHRHGdwFdT7E';
const SEAL_ID = 6446442088;
const OFFSET_FILE = path.join(__dirname, '.wallet-poller-offset.json');

const TON_WALLET_REGEX = /^[UE]Q[A-Za-z0-9_-]{46}$/;

function getOffset() {
  try { return JSON.parse(fs.readFileSync(OFFSET_FILE)).offset || 0; }
  catch(e) { return 0; }
}

function saveOffset(offset) {
  fs.writeFileSync(OFFSET_FILE, JSON.stringify({ offset }));
}

function tgGet(token, method, params = {}) {
  return new Promise((resolve, reject) => {
    const qs = Object.entries(params).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/${method}${qs ? '?' + qs : ''}`,
      method: 'GET'
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject); req.end();
  });
}

function tgSend(token, chatId, text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d))); });
    req.on('error', reject); req.write(body); req.end();
  });
}

async function main() {
  const offset = getOffset();
  console.log(`Polling NGMI bot updates from offset ${offset}...`);

  const result = await tgGet(NGMI_BOT, 'getUpdates', { offset, limit: 50, timeout: 0 });
  if (!result.ok || !result.result.length) {
    console.log('No new messages');
    process.exit(0);
  }

  let lastOffset = offset;
  let walletsFound = 0;

  for (const update of result.result) {
    lastOffset = update.update_id + 1;
    const msg = update.message;
    if (!msg || !msg.text) continue;

    const text = msg.text.trim();
    const from = msg.from;
    const chatId = msg.chat.id;

    // Check if message looks like a TON wallet
    const words = text.split(/\s+/);
    const wallet = words.find(w => TON_WALLET_REGEX.test(w));

    if (wallet) {
      walletsFound++;
      const username = from.username ? `@${from.username}` : from.first_name || 'Unknown';
      console.log(`Wallet received from ${username}: ${wallet}`);

      // Confirm receipt to winner
      await tgSend(NGMI_BOT, chatId,
        `✅ <b>Wallet received!</b>\n\n<code>${wallet}</code>\n\nYour 5 TON prize will be sent within 24 hours. Thanks for playing NGMI! 🐸`
      );

      // Forward to Seal
      await tgSend(AGENT_BOT, SEAL_ID,
        `💰 <b>NGMI Prize Claim</b>\n\n` +
        `Player: <b>${username}</b>\n` +
        `Telegram ID: <code>${from.id}</code>\n` +
        `Wallet: <code>${wallet}</code>\n\n` +
        `💸 Send 5 TON to the wallet above.`
      );
      console.log('Forwarded to Seal');
    }
  }

  saveOffset(lastOffset);
  console.log(`Done. Wallets found: ${walletsFound}`);
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
