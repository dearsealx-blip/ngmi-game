const https = require('https');
const TOKEN = '8733328088:AAE2CMtfiAL5RHU1jE6uUNnP7-tJ4h6pLAE';
const CHAT = '@NGMI_Ton';

const text = `\u{1F438} NGMI IS LIVE

Not Gonna Make It \u2014 the chart surfer game on TON.

Dodge candles. Stack sats. Survive the bear market.

\u{1F3AE} Play: t.me/NGMI_TON_BOT
\u{1F4C8} Contract: EQAVM23T_9nry_aV0BTc0DvmvsIJwfsgKGAnhXfEHBeYZVEI
\u{1F525} 100,000,000 supply \u2014 no presale, no VC

\u2728 Features:
- Daily challenges + streak multipliers (up to 2x score)
- 15 achievements to unlock
- Global / daily / season leaderboards
- Referral system (+10% bonus)
- Group tournaments

gm degens. let's see who's WAGMI and who's NGMI \u{1F480}

#NGMI #TON #GameFi #TONBlockchain`;

function send(chatId, msg) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ chat_id: chatId, text: msg, disable_web_page_preview: false });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: '/bot' + TOKEN + '/sendMessage',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

send(CHAT, text).then(r => {
  if (r.ok) console.log('Posted! message_id:', r.result.message_id);
  else console.error('Error:', JSON.stringify(r));
});
