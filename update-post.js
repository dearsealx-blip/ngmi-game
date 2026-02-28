const https = require('https');
const TOKEN = '8733328088:AAE2CMtfiAL5RHU1jE6uUNnP7-tJ4h6pLAE';
const CHAT = '@NGMI_Ton';

const text = `\u{1F525} MAJOR UPDATE — NGMI v2 IS LIVE

We just shipped a ton of new features. Here's what dropped:

\u{1F3AE} SKIN SHOP
Unlock 6 skins by playing — including exclusive skins for holders and legends:
\u{1F438} Default | \u{1F480} NGMI Skull | \u{1F680} Moon Boi | \u{1F40B} Whale | \u{1F48E} Diamond | \u{1F451} Legend

\u{1F525} DAILY STREAKS
Play every day to build your streak. Up to 2x score multiplier. Don't break the chain.

\u{1F3C6} ACHIEVEMENTS
15 achievements to unlock. Flex your progress.

\u2694\uFE0F CLAN WARS
Create or join a clan. Your scores count toward clan total. Weekly wars incoming.

\u{1F4E4} SCORE CARDS
Share your score as an image directly to any chat.

\u{1F4C5} SEASON LEADERBOARD
Monthly rankings reset every 1st. Compete for the top spot.

\u{1F48E} HOLDER BONUS
NGMI holders get +20% score bonus. Verify in-game.

\u{1F517} REFERRALS
Invite frens with your personal link. They get a bonus, you get clout.

Play now: t.me/NGMI_TON_BOT

#NGMI #TON #GameFi #Update`;

function send(chatId, msg) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ chat_id: chatId, text: msg });
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
